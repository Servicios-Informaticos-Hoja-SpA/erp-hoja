import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export interface UploadResult {
  fileUrl: string;
  storagePath: string;
  tamanoBytes: number;
  fileType: string;
}

export async function subirArchivoProyectoStorage(
  proyectoId: string, 
  file: File
): Promise<UploadResult> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `proyectos/${proyectoId}/${timestamp}_${safeName}`;
  const fileType = file.name.split(".").pop()?.toLowerCase() || "archivo";

  try {
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
      fileUrl: downloadUrl,
      storagePath,
      tamanoBytes: file.size,
      fileType,
    };
  } catch (storageError) {
    console.warn("Storage upload failed or permission denied, falling back to local object reader:", storageError);
    // Fallback con FileReader / Data URL para garantizar continuidad sin bloqueos
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          fileUrl: reader.result as string,
          storagePath: `local/${safeName}`,
          tamanoBytes: file.size,
          fileType,
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }
}
