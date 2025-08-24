import { ref, watch, onUnmounted } from "vue"
import { db } from "@/firebase/firebase"
import { ref as dbRef, onValue, set, update } from "firebase/database"
import dayjs from "dayjs"
import defaultImage from "@/assets/images/default_image.webp"
import type { FriendItem, FocusRequest } from "@/types"

export function useFriends() {
  const showFriendPanel = ref(false)
  const onlineFriends = ref<FriendItem[]>([])
  const selectedFriends = ref<FriendItem[]>([])
  let friendsTimer: number | null = null

  watch(
    onlineFriends,
    (newFriendsList) => {
      selectedFriends.value.forEach((selectedFriend, index) => {
        const updatedData = newFriendsList.find((f) => f.id === selectedFriend.id)
        if (updatedData) {
          selectedFriends.value[index] = { ...selectedFriend, ...updatedData }
        }
      })
    },
    { deep: true }
  )

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

  function formatFriendTime(time: number) {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  function requestFriendToJoin(friend: FriendItem, currentUserId: string, currentUserName: string) {
    const requestRef = dbRef(db, `focusRequests/${friend.id}/${currentUserId}`)
    set(requestRef, {
      from: currentUserId,
      fromName: currentUserName,
      status: 'PENDING',
      createdAt: Date.now(),
    })
  }

  function subscribeToFocusRequests(
    currentUserId: string,
    onNewRequest: (req: FocusRequest & { fromId: string }) => void,
  ) {
    const requestsRef = dbRef(db, `focusRequests/${currentUserId}`)
    onValue(requestsRef, (snapshot) => {
      const requests = snapshot.val() || {}
      Object.keys(requests).forEach((fromId) => {
        const req = requests[fromId] as FocusRequest
        if (req.status === 'PENDING') {
          onNewRequest({ ...req, fromId })
        }
      })
    })
  }

  function acceptRequest(friendId: string, fromId: string) {
    const requestRef = dbRef(db, `focusRequests/${friendId}/${fromId}`)
    update(requestRef, { status: 'ACCEPTED' })

    const friend = onlineFriends.value.find((f) => f.id === fromId)
    if (friend) addFriendToScreen(friend)
  }

  function declineRequest(friendId: string, fromId: string) {
    const requestRef = dbRef(db, `focusRequests/${friendId}/${fromId}`)
    update(requestRef, { status: 'DECLINED' })
  }

  onUnmounted(() => {
    if (friendsTimer) clearInterval(friendsTimer)
  })

  return {
    showFriendPanel,
    onlineFriends,
    selectedFriends,
    subscribeToFriends,
    toggleFriendPanel,
    closeFriendPanel,
    addFriendToScreen,
    removeFriendFromScreen,
    formatFriendTime,
    requestFriendToJoin,
    subscribeToFocusRequests,
    acceptRequest,
    declineRequest,
  }
}
