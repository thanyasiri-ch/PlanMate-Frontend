/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { ref, onUnmounted } from 'vue'
import { db } from '@/firebase/firebase'
import { ref as dbRef, onValue } from 'firebase/database'
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

  let friendsTimer: number | null = null

  // ---------- FRIEND PRESENCE ----------
  function subscribeToFriends(groupIds: string[], currentUserId: string) {
    groupIds.forEach((groupId) => {
      const groupRef = dbRef(db, `activeGroups/${groupId}`)
      onValue(groupRef, (snapshot) => {
        const members = snapshot.val() || {}
        const memberIds = Object.keys(members).filter((uid) => uid !== currentUserId)

        onlineFriends.value = memberIds.map((uid) => ({
          id: uid,
          name: "Loading...",
          image: "",
          timeLeft: 0,
          status: "UNKNOWN",
          sessionDuration: 0,
        }))

        memberIds.forEach((uid) => {
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

                if (session.status === "FOCUSING") {
                  const now = dayjs()
                  const startedAt = dayjs(session.startedAt)
                  const timeSinceResume = now.diff(startedAt, "second")
                  remainingTime = Math.max(0, plannedDuration - (elapsedSeconds + timeSinceResume))
                } else if (session.status === "PAUSED") {
                  remainingTime = Math.max(0, plannedDuration - elapsedSeconds)
                }

                onlineFriends.value[idx].timeLeft = remainingTime
                onlineFriends.value[idx].status = session.status
                onlineFriends.value[idx].sessionDuration = plannedDuration

                startFriendsTimer()
              })
            } else {
              onlineFriends.value[friendIndex].status = "ONLINE"
              onlineFriends.value[friendIndex].timeLeft = 0
              onlineFriends.value[friendIndex].sessionDuration = 0
            }
          })
        })
      })
    })
  }

  function startFriendsTimer() {
    if (friendsTimer) return
    friendsTimer = setInterval(() => {
      selectedFriends.value.forEach((friend) => {
        if (friend.status === "FOCUSING" && friend.timeLeft > 0) {
          friend.timeLeft--
        }
      })
    }, 1000)
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
  }

  function removeFriendFromScreen(friendId: string) {
    selectedFriends.value = selectedFriends.value.filter((f) => f.id !== friendId)
  }

  // ---------- TIME ----------
  function formatFriendTime(time: number) {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
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

  async function joinRoom(roomId: string) {
    try {
      const { data } = await focusService.joinSharedRoom(roomId)
      activeSession.value = data
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

  // ---------- CLEANUP ----------
  onUnmounted(() => {
    if (friendsTimer) clearInterval(friendsTimer)
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
  }
})
