// 📚 Library
// ----------
const firebase_admin = require("firebase-admin");
const api_key = require("../private/key.json").api_key;

// all - Ambil Seluruh Data Database
const getAll = async (request, h) => {
    // Mengambil Kunci API dari Request Header
    const key = request.headers["x-api-key"];
    // Jika Kunci API Benar
    if (key === api_key) {
        const db = firebase_admin.firestore();
        const allCollection = [];
        const responseData = {};

        // Melist seluruh collection firestore
        await db.listCollections().then((collections) => {
            for (let collection of collections) {
                allCollection.push(`${collection.id}`);
            }
        });

        // Mengambil seluruh document di collection
        for (let collection of allCollection) {
            responseData[collection] = [];
            const outputDb = await db.collection(`${collection}`);
            const snapshot = await outputDb.get();
            snapshot.forEach((doc) => {
                const dataObject = {};
                dataObject[doc.id] = doc.data();
                responseData[collection].push(dataObject);
            });
        }

        const response = h.response(responseData);
        response.code(200);
        return response;
    }
    // Jika Kunci API Salah
    else {
        const response = h.response({
            status: "unauthorized",
        });
        response.code(401);
        return response;
    }
};

// all - Hapus Seluruh Data Database dan Authentication
const deleteAll = async (request, h) => {
    // Mengambil Kunci API dari Request Header
    const key = request.headers["x-api-key"];

    if (key === api_key) {
        const db = firebase_admin.firestore();
        const auth = firebase_admin.auth();
        const allCollection = [];

        try {
            // Mendapatkan seluruh koleksi dari Firestore
            await db.listCollections().then((collections) => {
                for (let collection of collections) {
                    allCollection.push(`${collection.id}`);
                }
            });

            // Menghapus seluruh dokumen di Firestore
            for (let collection of allCollection) {
                const outputDb = db.collection(`${collection}`);
                const snapshot = await outputDb.get();

                // Proses penghapusan dokumen dalam koleksi
                const deletePromises = snapshot.docs.map(async (doc) => {
                    const userData = doc.data();
                    if (userData.firebase_uid) {
                        // Menghapus data dari Authentication jika memiliki firebase_uid
                        await auth.deleteUser(userData.firebase_uid).catch((error) => {
                            console.error(
                                `Error deleting user from Authentication: ${userData.firebase_uid}`,
                                error
                            );
                        });
                    }
                    // Hapus dokumen dari Firestore
                    await db.collection(collection).doc(doc.id).delete();
                });

                await Promise.all(deletePromises);
            }

            // Respons jika berhasil
            const response = h.response({
                status: "success",
                message: "All data and authentication records have been deleted successfully.",
            });
            response.code(200);
            return response;
        } catch (error) {
            console.error("Error deleting data:", error);

            // Respons jika terjadi error
            const response = h.response({
                status: "error",
                message: "Failed to delete all data.",
            });
            response.code(500);
            return response;
        }
    } else {
        // Respons jika API key salah
        const response = h.response({
            status: "unauthorized",
        });
        response.code(401);
        return response;
    }
};


module.exports = {
    getAll,
    deleteAll,
};