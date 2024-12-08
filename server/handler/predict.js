// const fs = require("fs");
// const axios = require("axios");
// const FormData = require("form-data");
// const { api_key, ml_backend } = require("../private/key.json");
// const { getFoodInfoFromFirestore } = require("./foodService");

// const UPLOAD_DIR = "./uploads";

// /**
//  * Fungsi untuk mengirim file ke backend ML dan mendapatkan hasil prediksi
//  * @param {string} filePath - Path file yang akan dikirim
//  * @param {string} originalFilename - Nama asli file
//  * @returns {object} - Hasil prediksi dari backend
//  */
// const postImageWithAuthorization = async (filePath, originalFilename) => {
//     try {
//         const formData = new FormData();
//         formData.append("file", fs.createReadStream(filePath), originalFilename);

//         const headers = {
//             ...formData.getHeaders(),
//             "x-api-key": api_key,
//         };

//         const response = await axios.post(ml_backend, formData, { headers });
//         return response.data;
//     } catch (error) {
//         console.error("Error posting image:", error.response?.data || error.message);
//         throw error;
//     }
// };

// /**
//  * Handler utama untuk prediksi
//  * @param {object} req - Request dari frontend
//  * @param {object} h - Response toolkit Hapi.js
//  * @returns {object} - Response hasil prediksi dan informasi makanan
//  */
// const predict = async (req, h) => {
//     try {
//         const { file } = req.payload;

//         if (!file || !file.hapi || !file.hapi.filename || file._data.length === 0) {
//             return h.response({ error: "File tidak ditemukan atau file kosong." }).code(400);
//         }

//         if (!fs.existsSync(UPLOAD_DIR)) {
//             fs.mkdirSync(UPLOAD_DIR);
//         }

//         const tempPath = `${UPLOAD_DIR}/${file.hapi.filename}`;
//         const fileStream = fs.createWriteStream(tempPath);

//         await new Promise((resolve, reject) => {
//             file.pipe(fileStream);
//             file.on("end", resolve);
//             file.on("error", reject);
//         });

//         const stats = fs.statSync(tempPath);
//         if (stats.size === 0) {
//             fs.unlinkSync(tempPath);
//             return h.response({ error: "File kosong atau gagal diunggah." }).code(400);
//         }

//         // Kirim file ke backend ML untuk prediksi
//         const prediction = await postImageWithAuthorization(tempPath, file.hapi.filename);

//         // Hapus file sementara
//         fs.unlinkSync(tempPath);

//         const { predicted_class } = prediction;

//         if (!predicted_class) {
//             return h.response({
//                 status: "fail",
//                 message: "Prediksi tidak lengkap dari backend.",
//             }).code(400);
//         }

//         // Ambil informasi makanan dari Firestore berdasarkan hasil prediksi
//         const foodInfo = await getFoodInfoFromFirestore(predicted_class);

//         return h.response({
//             status: "success",
//             message: "Prediksi berhasil.",
//             prediction: {
//                 predicted_class,
//                 food_info: foodInfo,
//             },
//         }).code(200);
//     } catch (error) {
//         console.error("Prediction error:", error.message);
//         return h.response({
//             status: "error",
//             message: error.message || "Terjadi kesalahan pada server.",
//         }).code(500);
//     }
// };

// module.exports = { predict };
