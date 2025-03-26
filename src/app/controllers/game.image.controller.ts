import {Request, Response} from "express";
import Logger from "../../config/logger";
import { getGameById } from "../models/game.models";
import { getGameImage, setGameImage } from "../models/game.images.models";
import path from "path";
import fs from "fs";
import { alterUser, getUserById, getUserByToken } from "../models/user.models";

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
        const gameId = parseInt(req.params.id, 10);
        if (isNaN(gameId)) {
            res.status(400).send({error: "Invalid user id"});
            return;
        }

        const game = await getGameById(gameId);
        if (!game) {
            res.status(404).send({error: "No game with id"});
            return;
        }
        const gameImageFilename = await getGameImage(gameId);
        if (!gameImageFilename) {
            res.status(404).send({error: "No game image found"});
            return;
        }

        const imagePath = path.join(IMAGE_DIR, gameImageFilename);
        if (!fs.existsSync(imagePath)) {
            res.status(404).send({error: "Invalid image file"});
            return;
        }

        const mimeType = getMimeType(gameImageFilename);
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
            res.status(401).send({ error: "Not authorized" });
            return;
        }
        const token = authHeader as string;
        const authUser = await getUserByToken(token);
        if (!authUser) {
            res.status(401).send({ error: "Not authorized" });
            return;
        }
        const gameId = parseInt(req.params.id, 10);
        if (isNaN(gameId)) {
            res.status(400).send({ error: "Invalid game id"});
            return;
        }
        const game = await getGameById(gameId);
        if (!game) {
            res.status(404).send({ error: "No game with given id" });
            return;
        }
        if (authUser.id !== game.creatorId) {
            res.status(403).send({ error: "Forbidden" });
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
        const newFilename = `game_${gameId}_${Date.now()}${extension}`;
        const destPath = path.join(IMAGE_DIR, newFilename);
        fs.writeFileSync(destPath, req.body);

        const gameImageFilename = await getGameImage(gameId);
        const statusCode = gameImageFilename ? 200 : 201;
        await setGameImage(gameId, newFilename);
        // Need to make getGameImage return null | string for line above to work
        res.status(statusCode).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}


export {getImage, setImage};