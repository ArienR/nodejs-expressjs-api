import {Request, Response} from "express";
import fs from "fs";
import path from "path";
import Logger from "../../config/logger";
import { getUserById, alterUser, getUserByToken } from "../models/user.models";

const IMAGE_DIR = path.join(__dirname, "../../../storage/images");

const getMimeType = (filename: string): string => {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
        case ".png":
            return "image/png";
        case ".jpg":
        case ".jpeg":
            return "image/jpeg";
        case ".gif":
            return "image/gif";
        default:
            return "application/octet-stream";
    }
};

const getExtensionFromContentType = (contentType: string): string | null => {
    const mimeType = contentType.toLowerCase().split(';')[0].trim();
    switch (mimeType) {
        case "image/png":
            return ".png";
        case "image/jpeg":
        case "image/jpg":
            return ".jpg";
        case "image/gif":
            return ".gif";
        default:
            return null;
    }
};

const getImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.status(400).send({error: "Invalid user id"});
            return;
        }
        const user = await getUserById(userId);
        if (!user || !user.imageFilename) {
            res.status(404).send({error: "No image file found."});
            return;
        }
        const imagePath = path.join(IMAGE_DIR, user.imageFilename);
        if (!fs.existsSync(imagePath)) {
            res.status(404).send({error: "Invalid image file"});
            return;
        }
        const mimeType = getMimeType(user.imageFilename);
        res.status(200).sendFile(imagePath, { headers: { "Content-Type": mimeType } });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const contentType = req.header("Content-Type");
        const authHeader = req.header('x-authorization') || req.headers.authorization;
        if (!authHeader) {
            res.status(401).send();
            return;
        }
        const token = authHeader as string;
        const authUser = await getUserByToken(token);
        if (!authUser) {
            res.status(401).send();
            return;
        }
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.status(400).send();
            return;
        }
        if (authUser.id !== userId) {
            res.status(403).send();
            return;
        }
        const currentUser = await getUserById(userId);
        if (!currentUser) {
            res.status(404).send();
            return;
        }
        if (!contentType) {
            res.status(400).send({ error: "Content-Type header is missing" });
            return;
        }
        const extension = getExtensionFromContentType(contentType);
        if (!extension) {
            res.status(400).send({ error: "Invalid image supplied (incorrect file type)" });
            return;
        }
        if (!fs.existsSync(IMAGE_DIR)) {
            fs.mkdirSync(IMAGE_DIR, { recursive: true });
        }
        const newFilename = `user_${userId}_${Date.now()}${extension}`;
        const destPath = path.join(IMAGE_DIR, newFilename);
        fs.writeFileSync(destPath, req.body);
        const updatedUser = { ...currentUser, imageFilename: newFilename };
        await alterUser(updatedUser);
        const statusCode = currentUser.imageFilename ? 200 : 201;
        res.status(statusCode).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const deleteImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.header('x-authorization') || req.headers.authorization;
        if (!authHeader) {
            res.status(401).send();
            return;
        }
        const token = authHeader as string;
        const authUser = await getUserByToken(token);
        if (!authUser) {
            res.status(401).send();
            return;
        }
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.status(400).send();
            return;
        }
        if (authUser.id !== userId) {
            res.status(403).send();
            return;
        }
        const currentUser = await getUserById(userId);
        if (!currentUser) {
            res.status(404).send();
            return;
        }
        delete currentUser.imageFilename;
        res.statusMessage = "Image deleted successfully.";
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

export {getImage, setImage, deleteImage}