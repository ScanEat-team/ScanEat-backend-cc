const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const { api_key, ml_backend } = require("../private/key.json");
const { getFoodInfoFromFirestore } = require("./foodService");

const UPLOAD_DIR = "./uploads";

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
        throw error;
    }
};

const predict = async (req, h) => {
    try {
        const { file } = req.payload;

        if (!file || !file.hapi || !file.hapi.filename || file._data.length === 0) {
            return h.response({ error: "File tidak ditemukan atau file kosong." }).code(400);
        }

        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR);
        }

        const tempPath = `${UPLOAD_DIR}/${file.hapi.filename}`;
        const fileStream = fs.createWriteStream(tempPath);

        await new Promise((resolve, reject) => {
            file.pipe(fileStream);
            file.on("end", resolve);
            file.on("error", reject);
        });

        const stats = fs.statSync(tempPath);
        if (stats.size === 0) {
            fs.unlinkSync(tempPath);
            return h.response({ error: "File kosong atau gagal diunggah." }).code(400);
        }

        const prediction = await postImageWithAuthorization(tempPath, file.hapi.filename);

        fs.unlinkSync(tempPath);

        if (!prediction.predictions || prediction.predictions.length === 0) {
            return h.response({
                status: "fail",
                message: "Tidak ada barcode yang valid terdeteksi.",
            }).code(400);
        }

        const { predicted_class_upc, confidence, kategori } = prediction.predictions[0];

        // Ambil informasi makanan berdasarkan hasil prediksi
        const foodInfo = await getFoodInfoFromFirestore(predicted_class_upc);

        return h.response({
            status: "success",
            message: "Prediksi berhasil.",
            prediction: {
                predicted_class_upc,
                confidence,
                kategori,
                food_info: foodInfo,
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

module.exports = { predict };
