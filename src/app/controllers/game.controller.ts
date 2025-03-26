import {Request, Response} from "express";
import Logger from "../../config/logger";
import { getAllGenres, getAllPlatforms, getGames, getGameById, getAllTitles, createGame, updateGame, removeGame } from "../models/game.models";
import {getUserById, getUserByToken} from "../models/user.models";
import logger from "../../config/logger";


const getAllGames = async(req: Request, res: Response): Promise<void> => {
    try {
        const validSortBys = [
            'ALPHABETICAL_ASC',
            'ALPHABETICAL_DESC',
            'PRICE_ASC',
            'PRICE_DESC',
            'CREATED_ASC',
            'CREATED_DESC',
            'RATING_ASC',
            'RATING_DESC',
        ];

        const startIndex = req.query.startIndex !== undefined ? parseInt(req.query.startIndex as string, 10) : 0;
        if (!Number.isInteger(startIndex) || startIndex < 0) {
            res.status(400).send({ error: "Invalid start index" });
            return;
        }

        const count = req.query.count !== undefined ? parseInt(req.query.count as string, 10) : undefined;
        logger.info(count);
        if (count !== undefined && (!Number.isInteger(count) || count < 0)) {
            res.status(400).send({ error: "Invalid count" });
            return;
        }

        const q = req.query.q ? String(req.query.q) : undefined;

        let genreIds: number[] | undefined;
        if (req.query.genreIds) {
            const rawGenreIds = Array.isArray(req.query.genreIds)
                ? req.query.genreIds
                : String(req.query.genreIds).split(',');
            // Convert each id to a number, forcing the value to a string first.
            genreIds = rawGenreIds.map(idStr => parseInt(String(idStr), 10));
            if (genreIds.some(id => isNaN(id))) {
                res.status(400).send({ error: "Invalid genreIds; all values must be numbers." });
                return;
            }
            const validGenres = await getAllGenres();
            const validGenreIds = new Set(validGenres.map(genre => genre.genreId));
            if (!genreIds.every(id => validGenreIds.has(id))) {
                res.status(400).send({ error: "Invalid genreIds; one or more IDs do not exist." });
                return;
            }
        }

        let platformIds: number[] | undefined;
        if (req.query.platformIds) {
            const rawPlatformIds = Array.isArray(req.query.platformIds)
                ? req.query.platformIds
                : String(req.query.platformIds).split(',');
            platformIds = rawPlatformIds.map(idStr => parseInt(String(idStr), 10));
            if (platformIds.some(id => isNaN(id))) {
                res.status(400).send({ error: "Invalid platformIds; all values must be numbers." });
                return;
            }
            const validPlatforms = await getAllPlatforms();
            const validPlatformIds = new Set(validPlatforms.map(platform => platform.platformId));
            if (!platformIds.every(id => validPlatformIds.has(id))) {
                res.status(400).send({ error: "Invalid platformIds; one or more IDs do not exist." });
                return;
            }
        }

        const price = req.query.price !== undefined ? parseInt(req.query.price as string, 10) : undefined;
        if (price !== undefined && (isNaN(price) || price < 0)) {
            res.status(400).send({ error: "Invalid price" });
            return;
        }

        const creatorId = req.query.creatorId ? parseInt(req.query.creatorId as string, 10) : undefined;
        if (creatorId !== undefined && (typeof creatorId !== 'number' || isNaN(creatorId))) {
            res.status(400).send({ error: "Invalid creatorId" });
            return;
        }

        const reviewerId = req.query.reviewerId ? parseInt(req.query.reviewerId as string, 10) : undefined;
        if (reviewerId !== undefined && (typeof reviewerId !== 'number' || isNaN(reviewerId))) {
            res.status(400).send({ error: "Invalid reviewerId" });
            return;
        }

        const sortBy = req.query.sortBy ? String(req.query.sortBy) : 'CREATED_ASC';
        if (!validSortBys.includes(sortBy)) {
            res.status(400).send({error: "Invalid sortBy parameter"});
            return;
        }

        if (req.query.ownedByMe !== undefined && req.query.ownedByMe !== 'true' && req.query.ownedByMe !== 'false') {
            res.status(400).send({ error: "Invalid value for ownedByMe." });
            return;
        }
        const ownedByMe = req.query.ownedByMe === 'true';

        if (req.query.wishlistedByMe !== undefined && req.query.wishlistedByMe !== 'true' && req.query.wishlistedByMe !== 'false') {
            res.status(400).json({ error: "Invalid value for wishlistedByMe." });
            return;
        }
        const wishlistedByMe = req.query.wishlistedByMe === 'true';

        const authHeader = req.header('x-authorization') || req.headers.authorization;
        const token = typeof authHeader === 'string' ? authHeader : null;
        const authUser = token ? await getUserByToken(token) : null;
        if ((ownedByMe || wishlistedByMe) && (!authUser || !authUser.id)) {
            res.status(401).send({ error: "Not authorized" });
            return;
        }

        const params: GetAllGamesParams = {
            startIndex,
            count,
            q,
            genreIds,
            price,
            platformIds,
            creatorId,
            reviewerId,
            sortBy,
            ownedByMe,
            wishlistedByMe,
        };

        const result = authUser ? await getGames(params, { id: authUser.id }) : await getGames(params, null);
        res.status(200).json(result);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const getGame = async(req: Request, res: Response): Promise<void> => {
    try {
        const gameId = parseInt(req.params.id, 10);
        if (isNaN(gameId)) {
            res.status(400).send("Invalid game id");
            return;
        }
        const detailedGame = await getGameById(gameId);
        if (!detailedGame) {
            res.status(404).send("Game with given id does not exist");
            return;
        }
        res.status(200).json(detailedGame);
    } catch (err) {
        Logger.error(err);
        res.status(500).send("Internal Server Error");
    }
}

const addGame = async(req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.header('x-authorization') || req.headers.authorization;
        if (!authHeader) {
            res.status(401).send();
            return;
        }
        const token = authHeader as string;
        const authUser = await getUserByToken(token);
        if (!authUser) {
            res.status(401).send({error: "Not authorized"});
            return;
        }
        const genreId = parseInt(req.body.genreId, 10);
        if (isNaN(genreId)) {
            res.status(400).send({error: "Invalid genreId"});
            return;
        }
        const allGenres = await getAllGenres();
        const allGenreIds = allGenres.map((genre) => genre.genreId);
        if (!allGenreIds.includes(genreId)) {
            res.status(400).send({error: "Invalid genreId"});
            return;
        }
        const price = req.body.price;
        if (price === undefined || price === null || typeof price !== "number" || price < 0) {
            res.status(400).send({error: "Invalid price"});
            return;
        }
        // Validate title uniqueness
        const title = req.body.title;
        const allGameTitles = await getAllTitles();
        const isTitleTaken = allGameTitles.some((game: { Title: string; }) =>
            game.Title.toLowerCase() === title.toLowerCase()
        );
        if (isTitleTaken) {
            res.status(403).send({error: "Title already in use"});
            return;
        }
        // Validate platform ids
        const platformIds: number[] = req.body.platformIds;
        if (platformIds.length < 1) {
            res.status(400).send({error: "No platformIds provided"});
            return;
        }
        const allPlatforms = await getAllPlatforms();
        const platformIdsSet = allPlatforms.map(p => p.platformId);
        const arePlatformsValid = platformIds.every((platform) => platformIdsSet.includes(platform));
        if (!arePlatformsValid) {
            res.status(400).send({error: "Invalid platform provided"});
            return;
        }
        const description = req.body.description;
        if (description.length > 1024) {
            res.status(400).send({error: "Description is too long"});
            return;
        }
        const newGameId = await createGame({title, description, genreId, price, platformIds} as Game, authUser.id);
        res.status(201).json({ gameId: newGameId });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const editGame = async(req: Request, res: Response): Promise<void> => {
    try {
        // 1. Authenticate the user.
        const authHeader = req.header("x-authorization") || req.headers.authorization;
        if (!authHeader) {
            res.status(401).send();
            return;
        }
        const token = authHeader as string;
        const authUser = await getUserByToken(token);
        if (!authUser) {
            res.status(401).send({ error: "Not authorized" });
            return;
        }

        // 2. Get game id from URL parameters.
        const gameId = parseInt(req.params.id, 10);
        if (isNaN(gameId)) {
            res.status(400).send({ error: "Invalid game id" });
            return;
        }

        // 3. Retrieve the game.
        const game = await getGameById(gameId);
        if (!game) {
            res.status(404).send({ error: "Game not found" });
            return;
        }

        // 4. Verify that the authenticated user is the creator.
        if (game.creatorId !== authUser.id) {
            res.status(403).send({ error: "Not authorized" });
            return;
        }

        // 5. Ensure all fields are provided.
        const { title, description, genreId, price, platformIds } = req.body;
        if (
            title === undefined ||
            description === undefined ||
            genreId === undefined ||
            price === undefined ||
            platformIds === undefined
        ) {
            res.status(400).send({ error: "All fields must be provided" });
            return;
        }

        // 6. Validate title and description.
        if (typeof title !== "string" || title.trim() === "") {
            res.status(400).send({ error: "Title is required and must be a non-empty string" });
            return;
        }
        if (typeof description !== "string" || description.trim() === "") {
            res.status(400).send({ error: "Description is required and must be a non-empty string" });
            return;
        }

        // 7. Validate genreId.
        const genreIdNum = parseInt(genreId, 10);
        if (isNaN(genreIdNum)) {
            res.status(400).send({ error: "Invalid genreId" });
            return;
        }
        const allGenres = await getAllGenres();
        const allGenreIds = allGenres.map((genre) => genre.genreId);
        if (!allGenreIds.includes(genreIdNum)) {
            res.status(400).send({ error: "Invalid genreId" });
            return;
        }

        // 8. Validate price.
        if (typeof price !== "number") {
            res.status(400).send({ error: "Price must be a number" });
            return;
        }

        // 9. Validate platformIds.
        if (!Array.isArray(platformIds) || platformIds.length === 0) {
            res.status(400).send({ error: "At least one platform must be provided" });
            return;
        }
        const allPlatforms = await getAllPlatforms();
        const validPlatformIds = allPlatforms.map((p) => p.platformId);
        const arePlatformsValid = platformIds.every((platform: number) =>
            validPlatformIds.includes(platform)
        );
        if (!arePlatformsValid) {
            res.status(400).send({ error: "Invalid platform provided" });
            return;
        }

        // 10. Validate title uniqueness if the title has changed.
        if (title.toLowerCase() !== game.title.toLowerCase()) {
            const allGameTitles = await getAllTitles();
            const isTitleTaken = allGameTitles.some((g: { Title: string }) =>
                g.Title.toLowerCase() === title.toLowerCase()
            );
            if (isTitleTaken) {
                res.status(403).send({ error: "Title already in use" });
                return;
            }
        }

        // 11. Prepare the updated game data.
        const updatedGameData = {
            title,
            description,
            genreId: genreIdNum,
            price,
            platformIds, // Assuming updateGame will handle updating platform associations.
        };

        // 12. Update the game.
        const updatedGameId = await updateGame(gameId, updatedGameData);
        // It's expected that updateGame returns the id of the updated game.

        // 13. Return success response.
        res.status(200).json({ gameId: updatedGameId });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const deleteGame = async(req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.header("x-authorization") || req.headers.authorization;
        if (!authHeader) {
            res.status(401).send();
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
            res.status(400).send({ error: "Invalid game id" });
            return;
        }
        const game = await getGameById(gameId);
        if (game === null) {
            res.status(404).send({ error: "Not Found. No game found with id" });
            return;
        }
        if (authUser.id !== game.creatorId) {
            res.status(403).send({ error: "Only the creator of a game may delete it" });
            return;
        }
        if (game.rating === null) {
            res.status(403).send({ error: "Can not delete a game with one or more reviews" });
            return;
        }
        await removeGame(gameId);
        res.statusMessage = "Game deleted successfully.";
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const getGenres = async(req: Request, res: Response): Promise<void> => {
    try {
        const genres = await getAllGenres();
        res.status(200).send([...genres])
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const getPlatforms = async(req: Request, res: Response): Promise<void> => {
    try {
        const platforms = await getAllPlatforms();
        res.status(200).send([...platforms]);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}


export { getAllGames, getGame, addGame, editGame, deleteGame, getGenres, getPlatforms };