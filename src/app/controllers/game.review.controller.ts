import {Request, Response} from "express";
import Logger from "../../config/logger";
import { getReviews, createReview } from "../models/game.reviews.models";
import { getGameById } from "../models/game.models";
import { getUserByToken } from "../models/user.models";


const getGameReviews = async(req: Request, res: Response): Promise<void> => {
    try {
        const gameId = parseInt(req.params.id, 10);
        if (isNaN(gameId)) {
            res.status(400).send({ error: "Invalid game id" });
            return;
        }
        const game = await getGameById(gameId);
        if (!game) {
            res.status(404).send({ error: "Game with given id doesn't exist" });
            return;
        }
        const gameReviews = await getReviews(gameId);
        res.status(200).send([...gameReviews]);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const addGameReview = async(req: Request, res: Response): Promise<void> => {
    try {
        const gameId = parseInt(req.params.id, 10);
        if (isNaN(gameId)) {
            res.status(400).send({ error: "Invalid game id" });
            return;
        }

        const game = await getGameById(gameId);
        if (!game) {
            res.status(404).send({ error: "Game with given id doesn't exist" });
            return;
        }

        const rating = parseInt(req.body.rating, 10);
        if (rating > 10 || rating < 1 || isNaN(rating)) {
            res.status(400).send({ error: "Invalid rating" });
            return;
        }

        const review = req.body.review;
        if (review && review.length > 512) {
            res.status(400).send({ error: "Review too long" });
            return;
        }

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

        if (game.creatorId === authUser.id) {
            res.status(403).send({ error: "Cannot review your own game" });
        }

        const existingReviews = await getReviews(gameId);
        const reviewerIds = new Set(existingReviews.map(r => r.reviewerId));
        if (reviewerIds.has(authUser.id)) {
            res.status(403).send({ error: "Can only review a game once" });
            return;
        }

        await createReview(gameId, authUser.id, rating, review);
        res.status(201).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}




export { getGameReviews, addGameReview };