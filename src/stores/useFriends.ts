/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { ref, onUnmounted } from 'vue'
import { db } from '@/firebase/firebase'
import { ref as dbRef, off, onValue, update, DataSnapshot } from 'firebase/database'
import dayjs from 'dayjs'
import defaultImage from '@/assets/images/default_image.webp'
import type { FriendItem, FocusSessionDTO, Invitation } from '@/types'
import focusService from '@/services/FocusSessionService'
import { getCurrentUser } from '@/services/auth'

export const useFriends = defineStore('focus', () => {
  // ---------- STATE ----------
  const showFriendPanel = ref(false)
  const onlineFriends = ref<FriendItem[]>([])
  const selectedFriends = ref<FriendItem[]>([])
  const activeSession = ref<FocusSessionDTO | null>(null)
  const invitations = ref<Invitation[]>([])
  const outgoingInvites = ref<{ to: string; from: string }[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let roomUnsubscribe: (() => void) | null = null
  let userUnsubscribe: (() => void) | null = null
  const friendSessionListeners = ref<Record<string, () => void>>({})
  let friendsTimer: number | null = null

  // ---------- FRIEND PRESENCE ----------
  async function subscribeToFriends(currentUserId: string) {
    const friendsRef = dbRef(db, `friendships/${currentUserId}`)
    onValue(friendsRef, (snapshot) => {
      const friends = snapshot.val() || {}

      const friendIds = Object.keys(friends)

      // Sync onlineFriends list
      onlineFriends.value = friendIds.map((uid) => {
        const existing = onlineFriends.value.find((f) => f.id === uid)
        const friendObj = existing || {
          id: uid,
          name: 'Loading...',
          image: '',
          timeLeft: 0,
          status: 'UNKNOWN',
          sessionDuration: 0,
        }
        return friendObj
      })

      // Attach listener for each friend's activeUser
      friendIds.forEach((uid) => {
        subscribeToFriendSession(uid)
      })
    })
  }

  function startFriendsTimer() {
    if (friendsTimer) return
    friendsTimer = setInterval(() => {
      selectedFriends.value.forEach((friend) => {
        if (friend.status === 'FOCUSING' && friend.timeLeft > 0) {
          friend.timeLeft--
        }
      })
    }, 1000)
  }

  // ---------- FRIEND SESSION TRACKING ----------
  function subscribeToFriendSession(uid: string) {
    // cleanup old listener if exists
    if (friendSessionListeners.value[uid]) {
      friendSessionListeners.value[uid]()
      delete friendSessionListeners.value[uid]
    }

    const userRef = dbRef(db, `activeUsers/${uid}`)
    const unsubscribeUser = onValue(userRef, (snap) => {
      const userData = snap.val()
      if (!userData) return

      const idx = onlineFriends.value.findIndex((f) => f.id === uid)
      if (idx !== -1) {
        onlineFriends.value[idx].name = userData.name
        onlineFriends.value[idx].image = userData.image || defaultImage
      }

      // cleanup old session listener
      if (friendSessionListeners.value[`${uid}-session`]) {
        friendSessionListeners.value[`${uid}-session`]()
        delete friendSessionListeners.value[`${uid}-session`]
      }

      if (userData.focusSessionId) {
        const sessionRef = dbRef(db, `focusSessions/${userData.focusSessionId}`)
        const unsubscribeSession = onValue(sessionRef, (sessionSnap) => {
          const session = sessionSnap.val()
          if (!session) return

          const plannedDuration = session.duration * 60
          const elapsedSeconds = session.elapsedSeconds ?? 0
          let remainingTime = 0

          if (session.status === 'FOCUSING') {
            const now = dayjs()
            const startedAt = dayjs(session.startedAt)
            const timeSinceResume = now.diff(startedAt, 'second')
            remainingTime = Math.max(0, plannedDuration - (elapsedSeconds + timeSinceResume))
          } else if (session.status === 'PAUSED') {
            remainingTime = Math.max(0, plannedDuration - elapsedSeconds)
          }

          const friendObj: FriendItem = {
            id: uid,
            name: userData.name,
            image: userData.image || defaultImage,
            timeLeft: remainingTime,
            status: session.status,
            sessionDuration: plannedDuration,
          }

          // update onlineFriends
          const onlineIdx = onlineFriends.value.findIndex((f) => f.id === uid)
          if (onlineIdx !== -1) onlineFriends.value[onlineIdx] = friendObj

          // update selectedFriends if this friend is in shared room
          const selectedIdx = selectedFriends.value.findIndex((f) => f.id === uid)
          if (selectedIdx !== -1) selectedFriends.value[selectedIdx] = friendObj

          startFriendsTimer()
        })
        friendSessionListeners.value[`${uid}-session`] = () =>
          off(sessionRef, 'value', unsubscribeSession)
      }
    })

    friendSessionListeners.value[uid] = () => off(userRef, 'value', unsubscribeUser)
  }

  // ---------- FRIEND PANEL ----------
  function toggleFriendPanel() {
    showFriendPanel.value = !showFriendPanel.value
  }

  function closeFriendPanel() {
    showFriendPanel.value = false
  }

  function addFriendToScreen(friend: FriendItem) {
    if (selectedFriends.value.some((f) => f.id === friend.id)) return
    selectedFriends.value.push({ ...friend })
    console.log('Selected friends:', selectedFriends.value)
  }

  function removeFriendFromScreen(friendId: string) {
    const index = selectedFriends.value.findIndex((f) => f.id === friendId)
    if (index !== -1) {
      selectedFriends.value.splice(index, 1)
    }
  }

  // ---------- TIME ----------
  function formatFriendTime(time: number) {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // ---------- INVITATIONS (API) ----------
  async function inviteFriend(userId: string) {
    try {
      const { data } = await focusService.inviteFriend(userId)

      // mark in UI
      const idx = onlineFriends.value.findIndex((f) => f.id === userId)
      if (idx !== -1) {
        ;(onlineFriends.value[idx] as any)._invitePending = true
      }

      // also track outgoing for persistence in this session
      const currentUser = await getCurrentUser()
      if (currentUser) {
        outgoingInvites.value.push({ to: userId, from: currentUser.uid })
      }

      return data
    } catch (err: any) {
      error.value = err.response?.data || 'Failed to invite friend'
    }
  }

  function hasPendingInvitation(friendId: string, currentUserId: string): boolean {
    // Check locally marked flag (optimistic update)
    const friend = onlineFriends.value.find((f) => f.id === friendId)
    if (friend && (friend as any)._invitePending) {
      return true
    }

    // Otherwise, check Firebase invitations node for this friend
    return outgoingInvites.value.some((inv) => inv.to === friendId && inv.from === currentUserId)
  }

  async function subscribeToSharedRoom(roomId: string) {
    const user = await getCurrentUser()
    if (!user) return

    // cleanup previous listener
    if (roomUnsubscribe) {
      roomUnsubscribe()
      roomUnsubscribe = null
    }

    const roomRef = dbRef(db, `sharedRooms/${roomId}`)

    const handleRoomSnapshot = async (snapshot: DataSnapshot) => {
      const raw = snapshot.val()

      console.log(`[subscribeToSharedRoom] room snapshot for ${roomId}:`, raw)

      if (!raw) {
        console.log(`Room ${roomId} deleted → clearing state`)
        selectedFriends.value = []
        activeSession.value = null

        // reset activeUsers/{uid} flags so autoDetectSharedRoom doesn't re-subscribe
        const userActiveRef = dbRef(db, `activeUsers/${user.uid}`)
        await update(userActiveRef, {
          inSharedRoom: false,
          sharedRoomId: null,
        })

        // cleanup listener
        if (roomUnsubscribe) {
          roomUnsubscribe()
          roomUnsubscribe = null
        }
        return
      }

      let membersObj: Record<string, any> | null = null
      if (raw.members && typeof raw.members === 'object') {
        membersObj = raw.members
      } else if (typeof raw === 'object') {
        membersObj = raw
      }

      if (!membersObj) {
        console.warn(
          '[subscribeToSharedRoom] Unexpected room shape, could not derive members:',
          raw,
        )
        selectedFriends.value = []
        activeSession.value = null
        return
      }

      // collect only keys that look like user UIDs (basic heuristic: strings, non-empty)
      const allKeys = Object.keys(membersObj)
      const memberIds = allKeys.filter(
        (k) => typeof k === 'string' && k.length > 0 && k !== user.uid,
      )

      console.log(`[subscribeToSharedRoom] derived memberIds:`, memberIds)

      selectedFriends.value = memberIds.map((uid) => {
        const memberNode = membersObj[uid] || {}
        return {
          id: uid,
          name: memberNode.name || 'Unknown',
          image: memberNode.image || defaultImage,
          timeLeft: 0,
          status: (memberNode.status as any) || 'OFFLINE',
          sessionDuration: 0,
        } as FriendItem
      })

      // ensure friend session listeners are attached for these members
      memberIds.forEach((uid) => subscribeToFriendSession(uid))

      startFriendsTimer()
    }

    // attach listener and store unsubscribe in a way that off(roomRef, 'value', handler) works
    onValue(roomRef, handleRoomSnapshot)
    roomUnsubscribe = () => off(roomRef, 'value', handleRoomSnapshot)
  }

  async function autoDetectSharedRoom() {
    const user = await getCurrentUser()
    if (!user) {
      console.warn('[autoDetectSharedRoom] No user logged in')
      return
    }

    console.log('[autoDetectSharedRoom] Current user:', user.uid)

    if (userUnsubscribe) {
      console.log('[autoDetectSharedRoom] Cleaning old user listener')
      userUnsubscribe()
      userUnsubscribe = null
    }

    const userRef = dbRef(db, `activeUsers/${user.uid}`)
    console.log('[autoDetectSharedRoom] Listening at:', userRef.toString())

    const handleUserSnapshot = async (snapshot: DataSnapshot) => {
      console.log('[autoDetectSharedRoom] user snapshot exists:', snapshot.exists())
      const userData = snapshot.val()
      console.log('[autoDetectSharedRoom] userData:', userData)

      if (!userData) {
        console.warn('[autoDetectSharedRoom] No user data found, clearing state')
        selectedFriends.value = []
        activeSession.value = null
        return
      }

      const { inSharedRoom, sharedRoomId } = userData
      console.log('[autoDetectSharedRoom] Flags:', { inSharedRoom, sharedRoomId })

      if (roomUnsubscribe) {
        console.log('[autoDetectSharedRoom] Cleaning old room listener')
        roomUnsubscribe()
        roomUnsubscribe = null
      }

      if (inSharedRoom && sharedRoomId) {
        const roomRef = dbRef(db, `sharedRooms/${sharedRoomId}`)
        console.log('[autoDetectSharedRoom] Checking shared room at:', roomRef.toString())

        const handleRoomSnapshot = async (roomSnap: DataSnapshot) => {
          console.log('[autoDetectSharedRoom] Room snapshot exists:', roomSnap.exists())
          if (roomSnap.exists()) {
            console.log('✅ Auto-joining shared room:', sharedRoomId)
            subscribeToSharedRoom(sharedRoomId)
          } else {
            console.log('❌ Shared room not found → clearing state')
            selectedFriends.value = []
            activeSession.value = null
            await update(userRef, {
              inSharedRoom: false,
              sharedRoomId: null,
            })
          }
        }

        console.log('Attaching listener to shared room:', roomRef.toString())
        try {
          onValue(roomRef, handleRoomSnapshot, (err) => {
            console.error('Firebase onValue error:', err)
          })
        } catch (err) {
          console.error('Error attaching listener:', err)
        }
      } else {
        console.log('User not in shared room → clearing state')
        selectedFriends.value = []
        activeSession.value = null
      }
    }

    onValue(userRef, handleUserSnapshot)
    userUnsubscribe = () => off(userRef, 'value', handleUserSnapshot)
  }

  async function joinRoom(roomId: string) {
    try {
      const { data } = await focusService.joinSharedRoom(roomId)
      activeSession.value = data

      subscribeToSharedRoom(roomId)
    } catch (err: any) {
      error.value = err.response?.data || 'Failed to join room'
    }
  }

  async function declineInvitation(invitationId: string) {
    try {
      await focusService.declineInvitation(invitationId)
      invitations.value = invitations.value.filter((i) => i.id !== invitationId)
    } catch (err: any) {
      error.value = err.response?.data || 'Failed to decline invitation'
    }
  }

  function setInvitations(invites: Invitation[]) {
    invitations.value = invites
  }

  async function subscribeToInvitations() {
    const user = await getCurrentUser()
    if (!user) {
      console.error('[subscribeToInvitations] No current user')
      return
    }

    const invitesRef = dbRef(db, `invitations/${user.uid}`)
    console.log('[subscribeToInvitations] Listening at:', invitesRef.toString())

    onValue(invitesRef, (snapshot) => {
      const data = snapshot.val() || {}
      console.log('[subscribeToInvitations] Snapshot:', data)

      const parsed: Invitation[] = Object.entries(data).map(([id, val]: any) => ({
        id,
        from: val.from,
        fromName: val.fromName,
        roomId: val.roomId,
        timestamp: val.timestamp,
      }))
      invitations.value = parsed
      console.log('[subscribeToInvitations] Parsed invitations:', parsed)
    })
  }

  async function leaveRoom(roomId: string) {
    try {
      await focusService.leaveSharedRoom(roomId)

      // cleanup state
      selectedFriends.value = []
      activeSession.value = null

      if (roomUnsubscribe) {
        roomUnsubscribe()
        roomUnsubscribe = null
      }

      console.log(`Left shared room: ${roomId}`)
    } catch (err: any) {
      error.value = err.response?.data || 'Failed to leave room'
    }
  }

  // ---------- CLEANUP ----------
  onUnmounted(() => {
    if (friendsTimer) clearInterval(friendsTimer)
    if (userUnsubscribe) userUnsubscribe()
    if (roomUnsubscribe) roomUnsubscribe()
  })

  return {
    // state
    showFriendPanel,
    onlineFriends,
    selectedFriends,
    activeSession,
    invitations,
    loading,
    error,

    // actions
    subscribeToFriends,
    toggleFriendPanel,
    closeFriendPanel,
    addFriendToScreen,
    removeFriendFromScreen,
    formatFriendTime,
    inviteFriend,
    hasPendingInvitation,
    joinRoom,
    declineInvitation,
    setInvitations,
    subscribeToInvitations,
    autoDetectSharedRoom,
    leaveRoom,
  }
})
