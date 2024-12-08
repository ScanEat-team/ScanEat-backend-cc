const firebase_admin = require("firebase-admin");
const { Storage } = require("@google-cloud/storage");
const fs = require("fs");
const path = require("path");

const getAllMakanan = async (request, h) => {
    try {
        const db = firebase_admin.firestore();

        console.log("Memulai pengambilan semua kategori...");
        const kategoriSnapshot = await db.collection("makanan").get();

        if (kategoriSnapshot.empty) {
            return h.response({
                status: "success",
                message: "No categories found.",
                data: [],
            }).code(200); // OK
        }

        let allMakanan = []; // Menyimpan semua makanan dari semua kategori

        // Iterasi untuk setiap kategori
        for (const kategoriDoc of kategoriSnapshot.docs) {
            const kategori = kategoriDoc.id;
            console.log(`Memeriksa kategori: ${kategori}`);

            const itemsSnapshot = await db
                .collection("makanan")
                .doc(kategori)
                .collection("items")
                .get();

            if (!itemsSnapshot.empty) {
                itemsSnapshot.forEach((itemDoc) => {
                    const itemData = itemDoc.data();
                    allMakanan.push({
                        ...itemData,
                        kategori: kategori, // Tambahkan kategori ke setiap makanan
                    });
                });
            }
        }

        return h.response({
            status: "success",
            message: "Makanan data retrieved successfully.",
            data: allMakanan,
        }).code(200); // OK
    } catch (error) {
        console.error("Error retrieving makanan data:", error);

        return h.response({
            status: "error",
            message: "Failed to retrieve makanan data.",
            error: error.message,
        }).code(500); // Internal Server Error
    }
};



const getMakanan = async (request, h) => {
    try {
        const db = firebase_admin.firestore();

        // Mendapatkan kategori dari parameter
        const { kategori } = request.params;

        if (!kategori) {
            return h.response({
                status: "fail",
                message: "Kategori harus disertakan dalam parameter.",
            }).code(400); // 400 Bad Request
        }

        // Referensi ke koleksi
        const collectionRef = db.collection("makanan").doc(kategori).collection("items");

        // Mendapatkan semua dokumen dalam koleksi
        const snapshot = await collectionRef.get();

        if (snapshot.empty) {
            return h.response({
                status: "error",
                message: `Tidak ada data makanan untuk kategori '${kategori}'.`,
                data: [],
            }).code(404); // 404 Not Found
        }

        // Menyusun hasil
        const makananList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return h.response({
            status: "success",
            message: `Data makanan untuk kategori '${kategori}' berhasil diambil.`,
            data: makananList,
        }).code(200); // 200 OK
    } catch (error) {
        console.error("Error fetching makanan data:", error);

        return h.response({
            status: "error",
            message: "Gagal mengambil data makanan.",
            error: error.message, // Tambahkan detail error
        }).code(500); // 500 Internal Server Error
    }
};


const getMakananById = async (request, h) => {
    try {
        const db = firebase_admin.firestore();

        // Mendapatkan kategori dan ID makanan dari parameter
        const { kategori, makananId } = request.params;

        if (!kategori || !makananId) {
            return h.response({
                status: "fail",
                message: "Kategori dan ID makanan harus disertakan dalam parameter.",
            }).code(400); // 400 Bad Request
        }

        // Referensi ke dokumen
        const docRef = db.collection("makanan").doc(kategori).collection("items").doc(makananId);

        // Mendapatkan dokumen
        const doc = await docRef.get();

        if (!doc.exists) {
            return h.response({
                status: "error",
                message: `Data makanan dengan ID '${makananId}' di kategori '${kategori}' tidak ditemukan.`,
            }).code(404); // 404 Not Found
        }

        // Mengambil data dokumen
        const makananData = { id: doc.id, ...doc.data() };

        return h.response({
            status: "success",
            message: "Data makanan berhasil diambil.",
            data: makananData,
        }).code(200); // 200 OK
    } catch (error) {
        console.error("Error fetching makanan data by ID:", error);

        return h.response({
            status: "error",
            message: "Gagal mengambil data makanan.",
            error: error.message, // Tambahkan detail error
        }).code(500); // 500 Internal Server Error
    }
};



// Fungsi untuk menambahkan data makanan ke Firestore
const addMakanan = async (request, h) => {
    try {
        const db = firebase_admin.firestore();
        const storage = new Storage({
            keyFilename: path.join(__dirname, "../private/firebase.json"),
        });
        const bucketName = require("../private/key.json").storage_bucket;

        const {
            kategori,        // Contoh: "buah", "sayur", atau "daging"
            nama,            // Nama makanan
            deskripsi,       // Deskripsi makanan
            makanan_picture, // Gambar makanan
            nutrition        // Objek nutrition (contoh: { kalori: 100, protein: 5, ... })
        } = request.payload;

        // Validasi input
        if (!kategori || !nama || !deskripsi || !nutrition) {
            return h.response({
                status: "fail",
                message: "All fields (kategori, nama, deskripsi, nutrition) are required.",
            }).code(400); // Bad Request
        }

        // Pastikan nutrition adalah objek, bukan string JSON
        const nutritionData =
            typeof nutrition === "string" ? JSON.parse(nutrition) : nutrition;

        const makananId = "makanan_" + Date.now().toString(); // ID unik

        let pictureUrl = null;
        if (makanan_picture) {
            const filename = makanan_picture.hapi.filename;
            const data = makanan_picture._data;

            // Lokasi file di Cloud Storage
            const destFileName = `makanan/${kategori}/${makananId}/${filename}`;
            pictureUrl = `https://storage.googleapis.com/${bucketName}/${destFileName}`;

            // Upload buffer ke GCS
            const file = storage.bucket(bucketName).file(destFileName);
            await file.save(data);

            // Membuat file dapat diakses publik
            await file.makePublic();
        }

        // Pastikan dokumen kategori tersedia
        await db.collection("makanan").doc(kategori).set(
            { nama: kategori }, 
            { merge: true }
        );

        // Simpan data ke Firestore
        await db.collection("makanan").doc(kategori).collection("items").doc(makananId).set({
            id: makananId,
            nama: nama,
            deskripsi: deskripsi,
            nutrition: nutritionData,
            makanan_picture: pictureUrl || null,
        });

        return h.response({
            status: "success",
            message: "Makanan data has been successfully saved.",
            data: {
                makananId: makananId,
            },
        }).code(201); // Created
    } catch (error) {
        console.error("Error saving makanan data:", error);

        return h.response({
            status: "error",
            message: "Failed to save makanan data.",
            error: error.message,
        }).code(500); // Internal Server Error
    }
};



const updateMakanan = async (request, h) => {
    try {
        const db = firebase_admin.firestore();
        const storage = new Storage({
            keyFilename: path.join(__dirname, "../private/firebase.json"),
        });
        const bucketName = require("../private/key.json").storage_bucket;

        // Mendapatkan ID makanan dari parameter
        const { kategori, makananId } = request.params;

        // Mendapatkan data dari payload
        const {
            nama,
            deskripsi,
            nutrition, // Data nutrisi dalam bentuk JSON
            makanan_picture,
        } = request.payload;

        // Reference ke dokumen yang akan diupdate
        const docRef = db.collection("makanan").doc(kategori).collection("items").doc(makananId);

        // Periksa apakah dokumen ada
        const doc = await docRef.get();
        if (!doc.exists) {
            const response = h.response({
                status: "error",
                message: `Data makanan dengan ID '${makananId}' di kategori '${kategori}' tidak ditemukan.`,
            });
            response.code(404); // 404 Not Found
            return response;
        }

        // Mengelola pengunggahan gambar jika ada
        let pictureUrl = null;
        if (makanan_picture) {
            const filename = makanan_picture.hapi.filename;
            const data = makanan_picture._data;

            // Path sementara untuk file unggahan
            const tempDirectory = path.join(__dirname, "temp");
            const filePath = path.join(tempDirectory, filename);

            // Pastikan folder 'temp' ada
            if (!fs.existsSync(tempDirectory)) {
                fs.mkdirSync(tempDirectory);
            }

            // Tulis file sementara
            await fs.promises.writeFile(filePath, data);

            // Path file di GCS
            const destFileName = `makanan/${kategori}/${makananId}/${filename}`;
            pictureUrl = `https://storage.googleapis.com/${bucketName}/${destFileName}`;

            // Upload ke Cloud Storage
            const options = {
                destination: destFileName,
            };
            await storage.bucket(bucketName).upload(filePath, options);

            // Membuat file menjadi publik
            await storage.bucket(bucketName).file(destFileName).makePublic();

            // Hapus file sementara setelah upload
            await fs.promises.unlink(filePath);
        }

        // Update data di Firestore
        const updatedData = {
            ...(nama && { nama }),
            ...(deskripsi && { deskripsi }),
            ...(nutrition && { nutrition: JSON.parse(nutrition) }), // Parsing data nutrisi dari JSON string
            ...(pictureUrl && { makanan_picture: pictureUrl }),
        };

        await docRef.update(updatedData);

        const response = h.response({
            status: "success",
            message: "Data makanan berhasil diperbarui.",
        });

        response.code(200); // 200 OK
        return response;
    } catch (error) {
        console.error("Error updating makanan data:", error);

        const response = h.response({
            status: "error",
            message: "Gagal memperbarui data makanan.",
        });

        response.code(500); // 500 Internal Server Error
        return response;
    }
};


const deleteAllMakanan = async (request, h) => {
    try {
        const db = firebase_admin.firestore();
        const storage = new Storage({
            keyFilename: path.join(__dirname, "../private/firebase.json"),
        });
        const bucketName = require("../private/key.json").storage_bucket;

        // Mendapatkan kategori dari parameter
        const { kategori } = request.params;

        // Validasi kategori
        if (!kategori) {
            return h.response({
                status: "error",
                message: "Kategori tidak boleh kosong.",
            }).code(400); // 400 Bad Request
        }

        // Referensi ke koleksi makanan dalam kategori
        const collectionRef = db.collection("makanan").doc(kategori).collection("items");

        // Mendapatkan semua dokumen dalam koleksi
        const snapshot = await collectionRef.get();
        if (snapshot.empty) {
            return h.response({
                status: "error",
                message: `Tidak ada data makanan untuk kategori '${kategori}'.`,
            }).code(404); // 404 Not Found
        }

        // Menghapus semua dokumen beserta gambar terkait
        const batch = db.batch();
        const deletePromises = snapshot.docs.map(async (doc) => {
            const docData = doc.data();
            if (docData.makanan_picture) {
                const filePath = docData.makanan_picture.replace(`https://storage.googleapis.com/${bucketName}/`, "");
                await storage.bucket(bucketName).file(filePath).delete().catch((error) => {
                    console.warn("Failed to delete associated image from Cloud Storage:", error.message);
                });
            }
            batch.delete(doc.ref);
        });

        // Tunggu semua gambar dihapus sebelum commit batch
        await Promise.all(deletePromises);
        await batch.commit();

        return h.response({
            status: "success",
            message: `Semua data makanan di kategori '${kategori}' telah berhasil dihapus.`,
        }).code(200); // 200 OK
    } catch (error) {
        console.error("Error deleting all makanan data:", error);
        return h.response({
            status: "error",
            message: "Gagal menghapus semua data makanan.",
        }).code(500); // 500 Internal Server Error
    }
};


module.exports = { getAllMakanan, getMakanan, getMakananById, addMakanan,updateMakanan, deleteAllMakanan };
