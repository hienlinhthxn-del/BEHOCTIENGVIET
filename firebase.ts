import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ProgressRecord } from "./types";

// --- CẤU HÌNH FIREBASE (Thay bằng thông tin từ Firebase Console của bạn) ---
const firebaseConfig = {
    apiKey: "AIzaSyBsOXXDcvpPOOxvJDU215p-mnc16z4ljYE",
    authDomain: "behoctiengviet-ebb43.firebaseapp.com",
    projectId: "behoctiengviet-ebb43",
    storageBucket: "behoctiengviet-ebb43.firebasestorage.app",
    messagingSenderId: "407353522495",
    appId: "1:407353522495:web:abb22d09df40a090bf3b8a",
    measurementId: "G-JYYTR6C21X"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// --- CÁC HÀM XỬ LÝ DỮ LIỆU ---

/**
 * Lưu kết quả học tập lên Firestore
 */
export const saveProgressToFirebase = async (record: ProgressRecord) => {
    try {
        // Lưu vào collection 'progress'
        await addDoc(collection(db, "progress"), record);
        console.log("Đã lưu kết quả lên Firebase!");
    } catch (e) {
        console.error("Lỗi khi lưu lên Firebase: ", e);
    }
};

/**
 * Lấy danh sách kết quả học tập từ Firestore
 */
export const getProgressFromFirebase = async (): Promise<ProgressRecord[]> => {
    try {
        const q = query(collection(db, "progress"), orderBy("timestamp", "desc"), limit(100));
        const querySnapshot = await getDocs(q);
        const data: ProgressRecord[] = [];
        querySnapshot.forEach((doc) => {
            data.push(doc.data() as ProgressRecord);
        });
        return data;
    } catch (e) {
        console.error("Lỗi khi tải dữ liệu từ Firebase: ", e);
        return [];
    }
};

/**
 * Upload file ghi âm lên Firebase Storage và trả về đường dẫn (URL)
 * @param audioBlob File âm thanh (dạng Blob)
 * @param studentId Mã học sinh
 * @returns URL của file âm thanh để nghe lại
 */
export const uploadAudioFile = async (audioBlob: Blob, studentId: string): Promise<string> => {
    try {
        // Tạo tên file duy nhất: recordings/Mã_HS/Thời_gian.webm
        const filename = `recordings/${studentId}/${Date.now()}.webm`;
        const storageRef = ref(storage, filename);
        const snapshot = await uploadBytes(storageRef, audioBlob);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Lỗi upload file lên Storage:", error);
        return "";
    }
};

export { db, storage };