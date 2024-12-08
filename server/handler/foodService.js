// const firebase_admin = require("firebase-admin");
// const serviceAccount = require("../private/firebase.json");

// // Cek apakah Firebase sudah diinisialisasi
// if (!firebase_admin.apps.length) {
//     firebase_admin.initializeApp({
//         credential: firebase_admin.credential.cert(serviceAccount),
//     });
// }

// // Referensi ke Firestore
// const db = firebase_admin.firestore();

// /**
//  * Fungsi untuk mendapatkan informasi makanan berdasarkan prediksi kelas
//  * @param {string} predictedClass - Kelas yang diprediksi
//  * @returns {object} - Data makanan yang ditemukan
//  */
// const getFoodInfoFromFirestore = async (predictedClass) => {
//     try {
//         console.log("Fetching data for predicted class:", predictedClass);

//         // Ambil semua kategori dari koleksi "makanan"
//         const kategoriSnapshot = await db.collection("makanan").get();

//         if (kategoriSnapshot.empty) {
//             throw new Error("No categories found in Firestore.");
//         }

//         // Cari makanan dengan nama yang cocok di setiap kategori
//         for (const kategoriDoc of kategoriSnapshot.docs) {
//             const kategori = kategoriDoc.id;

//             const itemsSnapshot = await db
//                 .collection("makanan")
//                 .doc(kategori)
//                 .collection("items")
//                 .where("nama", "==", predictedClass)
//                 .get();

//             if (!itemsSnapshot.empty) {
//                 const itemDoc = itemsSnapshot.docs[0];
//                 return {
//                     ...itemDoc.data(),
//                     kategori,
//                 };
//             }
//         }

//         // Jika makanan tidak ditemukan
//         throw new Error(`Makanan dengan nama '${predictedClass}' tidak ditemukan.`);
//     } catch (error) {
//         console.error("Firestore error:", error.message);
//         throw error;
//     }
// };

// module.exports = { getFoodInfoFromFirestore };
