import {Request, Response} from "express";
import Logger from "../../config/logger";
import { getUserByToken } from "../models/user.models";
import { getGameById } from "../models/game.models";
import { addGameWishlist, getWishlistEntry, getOwnedEntry, removeGameWishlist, addGameOwned, removeGameOwned } from "../models/games.actions.models";


const addGameToWishlist = async(req: Request, res: Response): Promise<void> => {
    try {
        const gameId = parseInt(req.params.id, 10);
        if (isNaN(gameId)) {
            res.status(400).send({ error: "Invalid game id" });
            return;
        }

        const authHeader = req.header("x-authorization") || req.headers.authorization;
        if (!authHeader) {
            res.status(401).send({ error: "Not authorized" });
            return;
        }
        const token = authHeader as string;
        const authUser = await getUserByToken(token);
        if (!authUser) {
            res.status(401).json({ error: "Not authorized" });
            return;
        }

        const game = await getGameById(gameId);
        if (!game) {
            res.status(404).json({ error: "Game not found" });
            return;
        }

        if (game.creatorId === authUser.id) {
            res.status(403).json({ error: "Can not wishlist a game you created" });
        }

        const ownedEntry = await getOwnedEntry(gameId, authUser.id);
        if (ownedEntry) {
            res.status(403).json({ error: "Cannot wishlist a game you have marked as owned" });
            return;
        }

        const existingEntry = await getWishlistEntry(gameId, authUser.id);
        if (existingEntry) {
            res.status(200).json({ error: "Game already in wishlist" });
            return;
        }

        await addGameWishlist(authUser.id, gameId);
        res.status(200).send({ message: "Game added to wishlist" });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const removeGameFromWishlist = async(req: Request, res: Response): Promise<void> => {
    try {
        const gameId = parseInt(req.params.id, 10);
        if (isNaN(gameId)) {
            res.status(400).send({ error: "Invalid game id" });
            return;
        }

        const authHeader = req.header("x-authorization") || req.headers.authorization;
        if (!authHeader) {
            res.status(401).send({ error: "Not authorized" });
            return;
        }
        const token = authHeader as string;
        const authUser = await getUserByToken(token);
        if (!authUser) {
            res.status(401).json({ error: "Not authorized" });
            return;
        }

        const game = await getGameById(gameId);
        if (!game) {
            res.status(404).json({ error: "Game not found" });
            return;
        }

        const wishlistEntry = await getWishlistEntry(gameId, authUser.id);
        if (!wishlistEntry) {
            res.status(403).json({ error: "Cannot unwishlist a game you do not currently wishlist" });
            return;
        }

        await removeGameWishlist(gameId, authUser.id);
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const addGameToOwned = async(req: Request, res: Response): Promise<void> => {
    try {
        const gameId = parseInt(req.params.id, 10);
        if (isNaN(gameId)) {
            res.status(400).send({ error: "Invalid game id" });
            return;
        }

        const authHeader = req.header("x-authorization") || req.headers.authorization;
        if (!authHeader) {
            res.status(401).send({ error: "Not authorized" });
            return;
        }
        const token = authHeader as string;
        const authUser = await getUserByToken(token);
        if (!authUser) {
            res.status(401).json({ error: "Not authorized" });
            return;
        }

        const game = await getGameById(gameId);
        if (!game) {
            res.status(404).json({ error: "Game not found" });
            return;
        }

        if (game.creatorId === authUser.id) {
            res.status(403).json({ error: "Can not add a game you created to owned" });
        }

        const ownedEntry = await getOwnedEntry(gameId, authUser.id);
        if (ownedEntry) {
            res.status(200).json({ message: "Game already marked as owned" });
            return;
        }

        const wishlistEntry = await getWishlistEntry(gameId, authUser.id);
        if (wishlistEntry) {
            await removeGameWishlist(gameId, authUser.id);
        }

        await addGameOwned(authUser.id, gameId);
        res.status(200).json({ message: "Game marked as owned" });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const removeGameFromOwned = async(req: Request, res: Response): Promise<void> => {
    try {
        const gameId = parseInt(req.params.id, 10);
        if (isNaN(gameId)) {
            res.status(400).json({ error: "Invalid game id" });
            return;
        }

        const authHeader = req.header("x-authorization") || req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ error: "Not authorized" });
            return;
        }
        const token = authHeader as string;
        const authUser = await getUserByToken(token);
        if (!authUser) {
            res.status(401).json({ error: "Not authorized" });
            return;
        }

        const game = await getGameById(gameId);
        if (!game) {
            res.status(404).json({ error: "Game not found" });
            return;
        }

        const ownedEntry = await getOwnedEntry(gameId, authUser.id);
        if (!ownedEntry) {
            res.status(403).json({ error: "Cannot unmark a game you do not currently own" });
            return;
        }

        await removeGameOwned(gameId, authUser.id);
        res.status(200).json({ message: "Game unmarked as owned" });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

export { addGameToWishlist, removeGameFromWishlist, addGameToOwned, removeGameFromOwned };