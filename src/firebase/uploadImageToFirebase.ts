import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export const uploadImageToFirebase = async (file: File): Promise<string> => {
  const storage = getStorage()
  const storageRef = ref(storage, `groups/${Date.now()}_${file.name}`)

  await uploadBytes(storageRef, file)
  return await getDownloadURL(storageRef)
}
