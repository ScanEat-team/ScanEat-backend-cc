const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const firebase_admin = require("firebase-admin");
const { Storage } = require("@google-cloud/storage");
const { api_key, ml_backend, storage_bucket } = require("../private/key.json");
const { getFoodInfoFromFirestore } = require("./foodService");

const UPLOAD_DIR = "./uploads";
const storage = new Storage({
    keyFilename: path.join(__dirname, "../private/firebase.json"),
});

// Buat direktori UPLOAD_DIR jika belum ada
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

/**
 * Fungsi untuk mengirim file ke backend ML dan mendapatkan hasil prediksi
 * @param {string} filePath - Path file yang akan dikirim
 * @param {string} originalFilename - Nama asli file
 * @returns {object} - Hasil prediksi dari backend
 */

const postImageWithAuthorization = async (filePath, originalFilename) => {
    try {
        const formData = new FormData();
        formData.append("file", fs.createReadStream(filePath), originalFilename);

        const headers = {
            ...formData.getHeaders(),
            "x-api-key": api_key,
        };

        const response = await axios.post(ml_backend, formData, { headers });
        return response.data;
    } catch (error) {
        console.error("Error posting image:", error.response?.data || error.message);
        throw new Error("Gagal mendapatkan prediksi dari backend ML.");
    }
};


/**
 * Fungsi untuk menyimpan file gambar ke Google Cloud Storage bucket
 */
const uploadToBucket = async (filePath, destination) => {
    try {
        await storage.bucket(storage_bucket).upload(filePath, { destination });
        await storage.bucket(storage_bucket).file(destination).makePublic();
        return `https://storage.googleapis.com/${storage_bucket}/${destination}`;
    } catch (error) {
        console.error("Error uploading to bucket:", error.message);
        throw new Error("Gagal mengunggah file ke bucket.");
    }
};


/**
 * Fungsi untuk menyimpan history prediksi ke Firestore
 * @param {string} user_id - ID pengguna
 * @param {object} prediction - Hasil prediksi
 * @param {string} imageUrl - URL gambar dari GCS
 * @param {string} timestamp - Waktu prediksi
 */
const savePredictionHistory = async (user_id, prediction, imageUrl, timestamp) => {
    try {
        await firebase_admin.firestore().collection("prediction_history").add({
            user_id,
            timestamp,
            prediction,
            input_image_url: imageUrl, // Simpan URL GCS
        });
        console.log("Prediction history saved successfully.");
    } catch (error) {
        console.error("Error saving prediction history:", error.message);
    }
};




/**
 * Fungsi untuk mengambil history prediksi dari Firestore berdasarkan user_id
 * @param {string} user_id - ID pengguna
 * @returns {Array} - Daftar history prediksi
 */
const getPredictionHistory = async (user_id) => {
    try {
        const predictionQuery = await firebase_admin
            .firestore()
            .collection("prediction_history")
            .where("user_id", "==", user_id)
            .orderBy("timestamp", "desc")
            .get();

        if (predictionQuery.empty) {
            return [];
        }

        return predictionQuery.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Error fetching prediction history:", error.message);
        return [];
    }
};

/**
 * Handler utama untuk prediksi dan penyimpanan history
 * @param {object} req - Request dari frontend
 * @param {object} h - Response toolkit Hapi.js
 * @returns {object} - Response hasil prediksi dan informasi makanan
 */
const predictAndSaveHistory = async (req, h) => {
    try {
        const { file, user_id } = req.payload;

        if (!file || !file.hapi?.filename || file._data.length === 0) {
            return h.response({ status: "error", message: "File tidak valid atau kosong." }).code(400);
        }

        const tempPath = path.join(UPLOAD_DIR, file.hapi.filename);
        const fileStream = fs.createWriteStream(tempPath);

        await new Promise((resolve, reject) => {
            file.pipe(fileStream);
            file.on("end", resolve);
            file.on("error", reject);
        });

        const stats = fs.statSync(tempPath);
        if (stats.size === 0) {
            fs.unlinkSync(tempPath);
            return h.response({ status: "error", message: "File kosong atau gagal diunggah." }).code(400);
        }

        const prediction = await postImageWithAuthorization(tempPath, file.hapi.filename);

        const { predicted_class, confidence } = prediction;
        if (!predicted_class || typeof confidence === "undefined") {
            throw new Error("Prediksi tidak lengkap dari backend ML.");
        }

        const destination = `prediction-history/${user_id}/${Date.now()}_${file.hapi.filename}`;
        const imageUrl = await uploadToBucket(tempPath, destination);

        fs.unlinkSync(tempPath);

        const foodInfo = await getFoodInfoFromFirestore(predicted_class);

        const predictionData = {
            predicted_class,
            confidence,
            food_info: foodInfo,
        };

        const timestamp = new Date().toISOString();
        await savePredictionHistory(user_id, predictionData, imageUrl, timestamp);

        return h.response({
            status: "success",
            message: "Prediksi berhasil.",
            data: {
                id: timestamp, // Atau buat ID unik sesuai kebutuhan
                timestamp: timestamp,
                prediction: predictionData,
                input_image: imageUrl, // Menggunakan URL gambar dari GCS
            },
        }).code(200);
    } catch (error) {
        console.error("Prediction error:", error.message);
        return h.response({
            status: "error",
            message: error.message || "Terjadi kesalahan pada server.",
        }).code(500);
    }
};


/**
 * Handler untuk mengambil history prediksi berdasarkan user_id
 * @param {object} req - Request dari frontend
 * @param {object} h - Response toolkit Hapi.js
 * @returns {object} - Response dengan data history prediksi
 */
const getHistoryHandler = async (req, h) => {
    try {
        const user_id = req.params.user_id || req.query.user_id;

        if (!user_id) {
            return h.response({
                status: "error",
                message: "user_id tidak ditemukan.",
            }).code(400);
        }

        // Ambil history prediksi dari Firestore
        const historyData = await getPredictionHistory(user_id);

        if (historyData.length === 0) {
            return h.response({
                status: "success",
                message: "Tidak ada riwayat prediksi ditemukan.",
                data: [],
            }).code(200);
        }

        return h.response({
            status: "success",
            message: "History prediksi berhasil diambil.",
            data: historyData.map((item) => ({
                id: item.id,
                timestamp: item.timestamp,
                prediction: item.prediction,
                input_image: item.input_image_url, // Ambil URL dari Firestore
            })),
        }).code(200);
    } catch (error) {
        console.error("Error fetching prediction history:", error.message);
        return h.response({
            status: "error",
            message: "Terjadi kesalahan saat mengambil riwayat prediksi.",
        }).code(500);
    }
};



// Fungsi untuk menghapus history prediksi dari Firestore berdasarkan history_id
const deletePredictionHistory = async (history_id) => {
    try {
        await firebase_admin.firestore().collection("prediction_history").doc(history_id).delete();
        console.log("Prediction history deleted successfully.");
    } catch (error) {
        console.error("Error deleting prediction history:", error.message);
        throw error;
    }
};

// Handler untuk menghapus history prediksi berdasarkan history_id
const deleteHistoryHandler = async (req, h) => {
    try {
        const { history_id } = req.params;

        // Panggil fungsi untuk menghapus riwayat prediksi
        await deletePredictionHistory(history_id);

        return h.response({
            status: "success",
            message: "Riwayat prediksi berhasil dihapus.",
        }).code(200);
    } catch (error) {
        console.error("Error deleting prediction history:", error.message);
        return h.response({
            status: "error",
            message: "Terjadi kesalahan saat menghapus riwayat prediksi.",
        }).code(500);
    }
};

module.exports = { predictAndSaveHistory, getPredictionHistory, getHistoryHandler, deletePredictionHistory, deleteHistoryHandler };
