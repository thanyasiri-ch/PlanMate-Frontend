/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { ref, onUnmounted } from 'vue'
import { db } from '@/firebase/firebase'
import { ref as dbRef, off, onValue } from 'firebase/database'
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
  const groupMembers = ref<Record<string, string[]>>({})
  let roomUnsubscribe: (() => void) | null = null
  let userUnsubscribe: (() => void) | null = null
  const friendSessionListeners = ref<Record<string, () => void>>({})
  let friendsTimer: number | null = null

  // ---------- FRIEND PRESENCE ----------
  function subscribeToFriends(rawGroupIds: any, currentUserId: string) {
    const groupIds = normalizeGroups(rawGroupIds)
    console.log('Normalized group IDs:', groupIds)

    groupIds.forEach((groupId) => {
      console.log(`Subscribing to group: ${groupId}`)
      const groupRef = dbRef(db, `activeGroups/${groupId}`)

      onValue(groupRef, (snapshot) => {
        const members = snapshot.val() || {}
        console.log(`Group ${groupId} members snapshot:`, members)

        const memberIds = Object.keys(members).filter((uid) => uid !== currentUserId)
        console.log(`Filtered members (excluding current user ${currentUserId}):`, memberIds)

        // store group-specific members
        groupMembers.value[groupId] = memberIds

        // build union of all members across groups
        const allMembers = [...new Set(Object.values(groupMembers.value).flat())]

        // sync onlineFriends with allMembers
        onlineFriends.value = allMembers.map((uid) => {
          const existing = onlineFriends.value.find((f) => f.id === uid)
          return (
            existing || {
              id: uid,
              name: 'Loading...',
              image: '',
              timeLeft: 0,
              status: 'UNKNOWN',
              sessionDuration: 0,
            }
          )
        })

        // for each member, subscribe to user updates
        allMembers.forEach((uid) => {
          const userRef = dbRef(db, `activeUsers/${uid}`)
          onValue(userRef, (snap) => {
            const userData = snap.val()
            const friendIndex = onlineFriends.value.findIndex((f) => f.id === uid)
            if (!userData || friendIndex === -1) return

            onlineFriends.value[friendIndex].name = userData.name
            onlineFriends.value[friendIndex].image = userData.image || defaultImage

            if (userData.focusSessionId) {
              const sessionRef = dbRef(db, `focusSessions/${userData.focusSessionId}`)
              onValue(sessionRef, (sessionSnap) => {
                const session = sessionSnap.val()
                const idx = onlineFriends.value.findIndex((f) => f.id === uid)
                if (!session || idx === -1) return

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

                onlineFriends.value[idx].timeLeft = remainingTime
                onlineFriends.value[idx].status = session.status
                onlineFriends.value[idx].sessionDuration = plannedDuration

                startFriendsTimer()
              })
            } else {
              onlineFriends.value[friendIndex].status = 'ONLINE'
              onlineFriends.value[friendIndex].timeLeft = 0
              onlineFriends.value[friendIndex].sessionDuration = 0
            }
          })
        })
      })
    })
  }

  function normalizeGroups(groups: any): string[] {
    if (!groups) return []

    return groups.map((g: string) => (g.startsWith('group_') ? g.replace('group_', '') : g))
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

    const roomRef = dbRef(db, `sharedRooms/${roomId}`)
    onValue(roomRef, (snapshot) => {
      const members = snapshot.val() || {}
      const memberIds = Object.keys(members).filter((uid) => uid !== user.uid)

      // Reset selectedFriends (only members in this room)
      selectedFriends.value = memberIds.map((uid) => ({
        id: uid,
        name: members[uid].name,
        image: members[uid].image || defaultImage,
        timeLeft: 0, // will be filled by session listener
        status: 'OFFLINE',
        sessionDuration: 0,
      }))

      // subscribe to each friend’s focus session
      memberIds.forEach((uid) => subscribeToFriendSession(uid))

      startFriendsTimer()
    })
  }

  async function autoDetectSharedRoom() {
    const user = await getCurrentUser()
    if (!user) return

    // cleanup previous user listener if re-run
    if (userUnsubscribe) {
      userUnsubscribe()
      userUnsubscribe = null
    }

    const userRef = dbRef(db, `activeUsers/${user.uid}`)
    onValue(userRef, (snapshot) => {
      const userData = snapshot.val()
      if (!userData) return

      const { inSharedRoom, sharedRoomId } = userData

      // cleanup old room listener if room changes
      if (roomUnsubscribe) {
        roomUnsubscribe()
        roomUnsubscribe = null
      }

      if (inSharedRoom && sharedRoomId) {
        // verify that user is actually a member of this shared room
        const roomRef = dbRef(db, `sharedRooms/${sharedRoomId}/${user.uid}`)
        onValue(roomRef, (roomSnap) => {
          if (roomSnap.exists()) {
            console.log('Auto-joining shared room:', sharedRoomId)
            subscribeToSharedRoom(sharedRoomId)
          } else {
            console.log('User not found in room members → clearing selectedFriends')
            selectedFriends.value = []
            activeSession.value = null
          }
        })
      } else {
        console.log('User not in shared room, clearing selectedFriends')
        selectedFriends.value = []
        activeSession.value = null
      }
    })
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
    if (!user) return

    const invitesRef = dbRef(db, `invitations/${user.uid}`)
    onValue(invitesRef, (snapshot) => {
      const data = snapshot.val() || {}
      const parsed: Invitation[] = Object.entries(data).map(([id, val]: any) => ({
        id,
        from: val.from,
        fromName: val.fromName,
        roomId: val.roomId,
        timestamp: val.timestamp,
      }))
      invitations.value = parsed
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
