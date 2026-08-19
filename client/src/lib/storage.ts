import { storage } from "./firebase.js";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

/**
 * Uploads a base64 data URL to Firebase Storage and returns a fetchable URL.
 * The URL is small and can be safely saved to Firestore for real-time sync.
 */
export async function uploadImageToStorage(
  boardId: string,
  boxId: string,
  dataUrl: string
): Promise<string> {
  const imageRef = ref(storage, "boards/" + boardId + "/images/" + boxId + ".jpg");
  await uploadString(imageRef, dataUrl, "data_url");
  return await getDownloadURL(imageRef);
}
