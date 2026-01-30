"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cloudinary_1 = require("../../utils/cloudinary");
const multer_middleware_1 = require("../middlewares/multer.middleware");
const router = express_1.default.Router();
// Upload Image Endpoint
router.post("/upload-to-cloudinary", multer_middleware_1.upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: "No file uploaded or invalid file type.",
            });
            return;
        }
        const localFilePath = req.file && req.file.path;
        // Upload the file to Cloudinary
        const uploadResponse = await (0, cloudinary_1.uploadOnCloudinary)(localFilePath);
        if (!uploadResponse) {
            res.status(500).json({
                success: false,
                message: "Failed to upload image to Cloudinary.",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Image uploaded successfully.",
            data: {
                url: uploadResponse.secure_url,
                public_id: uploadResponse.public_id,
            },
        });
    }
    catch (error) { }
});
exports.default = router;
