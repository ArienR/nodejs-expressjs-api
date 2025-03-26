import { getPool } from "../../config/db";

// const getGames = async (
//     params: GetAllGamesParams,
//     authUser: { id: number } | null
// ): Promise<{ games: any[]; count: number }> => {
//     // Set defaults for pagination.
//     const startIndex = params.startIndex || 0;
//     const limit = params.count; // undefined if not provided
//
//     // Build the WHERE clause conditions and parameters.
//     const baseParams: any[] = [];
//     const conditions: string[] = [];
//
//     if (params.q) {
//         conditions.push("(g.title LIKE ? OR g.description LIKE ?)");
//         baseParams.push(`%${params.q}%`, `%${params.q}%`);
//     }
//     if (params.genreIds && params.genreIds.length > 0) {
//         const placeholders = params.genreIds.map(() => '?').join(',');
//         conditions.push(`g.genre_id IN (${placeholders})`);
//         baseParams.push(...params.genreIds);
//     }
//     if (params.price !== undefined) {
//         conditions.push("g.price <= ?");
//         baseParams.push(params.price);
//     }
//     if (params.platformIds && params.platformIds.length > 0) {
//         const placeholders = params.platformIds.map(() => '?').join(',');
//         conditions.push(`gp.platform_id IN (${placeholders})`);
//         baseParams.push(...params.platformIds);
//     }
//     if (params.creatorId !== undefined) {
//         conditions.push("g.creator_id = ?");
//         baseParams.push(params.creatorId);
//     }
//     if (params.reviewerId !== undefined) {
//         conditions.push("gr.user_id = ?");
//         baseParams.push(params.reviewerId);
//     }
//     if (params.ownedByMe) {
//         conditions.push("o.user_id = ?");
//         baseParams.push(authUser!.id);
//     }
//     if (params.wishlistedByMe) {
//         conditions.push("w.user_id = ?");
//         baseParams.push(authUser!.id);
//     }
//
//     // Begin building the query.
//     let query = `
//     SELECT
//       g.id AS gameId,
//       g.title,
//       g.genre_id AS genreId,
//       g.creator_id AS creatorId,
//       u.first_name AS creatorFirstName,
//       u.last_name AS creatorLastName,
//       g.price,
//       COALESCE(AVG(gr.rating), 0) AS rating,
//       g.creation_date AS creationDate,
//       GROUP_CONCAT(DISTINCT gp.platform_id) AS platformIds
//     FROM game g
//     LEFT JOIN user u ON g.creator_id = u.id
//     LEFT JOIN game_platforms gp ON g.id = gp.game_id
//     LEFT JOIN game_review gr ON g.id = gr.game_id
//     `;
//
//     // Add the owned and wishlist joins.
//     if (params.ownedByMe) {
//         query += " INNER JOIN owned o ON g.id = o.game_id ";
//     } else {
//         query += " LEFT JOIN owned o ON g.id = o.game_id ";
//     }
//     if (params.wishlistedByMe) {
//         query += " INNER JOIN wishlist w ON g.id = w.game_id ";
//     } else {
//         query += " LEFT JOIN wishlist w ON g.id = w.game_id ";
//     }
//
//     // Add WHERE conditions if needed.
//     if (conditions.length > 0) {
//         query += " WHERE " + conditions.join(" AND ");
//     }
//
//     // Grouping.
//     query += " GROUP BY g.id ";
//
//     // Sorting.
//     switch (params.sortBy) {
//         case 'ALPHABETICAL_ASC':
//             query += " ORDER BY g.title ASC ";
//             break;
//         case 'ALPHABETICAL_DESC':
//             query += " ORDER BY g.title DESC ";
//             break;
//         case 'PRICE_ASC':
//             query += " ORDER BY g.price ASC ";
//             break;
//         case 'PRICE_DESC':
//             query += " ORDER BY g.price DESC ";
//             break;
//         case 'CREATED_ASC':
//             query += " ORDER BY g.creation_date ASC ";
//             break;
//         case 'CREATED_DESC':
//             query += " ORDER BY g.creation_date DESC ";
//             break;
//         case 'RATING_ASC':
//             query += " ORDER BY rating ASC ";
//             break;
//         case 'RATING_DESC':
//             query += " ORDER BY rating DESC ";
//             break;
//         default:
//             query += " ORDER BY g.creation_date DESC ";
//     }
//
//     // Pagination.
//     const mainParams = [...baseParams];
//     if (limit !== undefined) {
//         query += " LIMIT ? OFFSET ? ";
//         mainParams.push(limit, startIndex);
//     }
//
//     // Get connection and execute queries.
//     const conn = await getPool().getConnection();
//     const [rows] = await conn.query(query, mainParams);
//     const games = Array.isArray(rows)
//         ? rows.map((row: any) => ({
//             gameId: row.gameId,
//             title: row.title,
//             genreId: row.genreId,
//             creatorId: row.creatorId,
//             creatorFirstName: row.creatorFirstName,
//             creatorLastName: row.creatorLastName,
//             price: row.price,
//             rating: parseFloat(row.rating),
//             creationDate: row.creationDate,
//             platformIds: row.platformIds
//                 ? row.platformIds.split(',').map((id: string) => parseInt(id, 10))
//                 : [],
//         }))
//         : [];
//
//     // Count query (ignoring LIMIT/OFFSET).
//     let countQuery = `
//       SELECT COUNT(DISTINCT g.id) AS totalCount
//       FROM game g
//       LEFT JOIN user u ON g.creator_id = u.id
//       LEFT JOIN game_platforms gp ON g.id = gp.game_id
//       LEFT JOIN game_review gr ON g.id = gr.game_id
//     `;
//     if (params.ownedByMe) {
//         countQuery += " INNER JOIN owned o ON g.id = o.game_id ";
//     } else {
//         countQuery += " LEFT JOIN owned o ON g.id = o.game_id ";
//     }
//     if (params.wishlistedByMe) {
//         countQuery += " INNER JOIN wishlist w ON g.id = w.game_id ";
//     } else {
//         countQuery += " LEFT JOIN wishlist w ON g.id = w.game_id ";
//     }
//     if (conditions.length > 0) {
//         countQuery += " WHERE " + conditions.join(" AND ");
//     }
//     const [countRows] = await conn.query(countQuery, baseParams);
//     const totalCount = countRows && (countRows as any[])[0] ? (countRows as any[])[0].totalCount : 0;
//
//     conn.release();
//     return { games, count: totalCount };
// };

const getGames = async (
    params: GetAllGamesParams,
    authUser: { id: number } | null
): Promise<{ games: any[]; count: number }> => {
    // Set defaults for pagination.
    const startIndex = params.startIndex || 0;
    const providedCount = params.count; // May be undefined

    // Build the WHERE clause conditions and parameters.
    const baseParams: any[] = [];
    const conditions: string[] = [];

    if (params.q) {
        conditions.push("(g.title LIKE ? OR g.description LIKE ?)");
        baseParams.push(`%${params.q}%`, `%${params.q}%`);
    }
    if (params.genreIds && params.genreIds.length > 0) {
        const placeholders = params.genreIds.map(() => '?').join(',');
        conditions.push(`g.genre_id IN (${placeholders})`);
        baseParams.push(...params.genreIds);
    }
    if (params.price !== undefined) {
        conditions.push("g.price <= ?");
        baseParams.push(params.price);
    }
    if (params.platformIds && params.platformIds.length > 0) {
        const placeholders = params.platformIds.map(() => '?').join(',');
        conditions.push(`gp.platform_id IN (${placeholders})`);
        baseParams.push(...params.platformIds);
    }
    if (params.creatorId !== undefined) {
        conditions.push("g.creator_id = ?");
        baseParams.push(params.creatorId);
    }
    if (params.reviewerId !== undefined) {
        conditions.push("gr.user_id = ?");
        baseParams.push(params.reviewerId);
    }
    if (params.ownedByMe) {
        conditions.push("o.user_id = ?");
        baseParams.push(authUser!.id);
    }
    if (params.wishlistedByMe) {
        conditions.push("w.user_id = ?");
        baseParams.push(authUser!.id);
    }

    // Begin building the base query for both count and main query.
    let baseQuery = `
    FROM game g
    LEFT JOIN user u ON g.creator_id = u.id
    LEFT JOIN game_platforms gp ON g.id = gp.game_id
    LEFT JOIN game_review gr ON g.id = gr.game_id
  `;

    // Add the owned and wishlist joins.
    if (params.ownedByMe) {
        baseQuery += " INNER JOIN owned o ON g.id = o.game_id ";
    } else {
        baseQuery += " LEFT JOIN owned o ON g.id = o.game_id ";
    }
    if (params.wishlistedByMe) {
        baseQuery += " INNER JOIN wishlist w ON g.id = w.game_id ";
    } else {
        baseQuery += " LEFT JOIN wishlist w ON g.id = w.game_id ";
    }

    // Add WHERE conditions if needed.
    if (conditions.length > 0) {
        baseQuery += " WHERE " + conditions.join(" AND ");
    }

    // First, get the total count ignoring pagination.
    const countQuery = `
      SELECT COUNT(DISTINCT g.id) AS totalCount
      ${baseQuery}
  `;

    const conn = await getPool().getConnection();
    const [countRows] = await conn.query(countQuery, baseParams);
    const totalCount = countRows && (countRows as any[])[0] ? (countRows as any[])[0].totalCount : 0;

    // Determine limit: if count is provided, use it; otherwise, use the total count.
    const limit = providedCount !== undefined ? providedCount : totalCount;

    // Now build the main query.
    let query = `
    SELECT
      g.id AS gameId,
      g.title,
      g.genre_id AS genreId,
      g.creator_id AS creatorId,
      u.first_name AS creatorFirstName,
      u.last_name AS creatorLastName,
      g.price,
      COALESCE(AVG(gr.rating), 0) AS rating,
      g.creation_date AS creationDate,
      GROUP_CONCAT(DISTINCT gp.platform_id) AS platformIds
    ${baseQuery}
    GROUP BY g.id
  `;

    // Sorting.
    const sortBy = params.sortBy ? String(params.sortBy) : 'CREATED_ASC';
    switch (sortBy) {
        case 'ALPHABETICAL_ASC':
            query += " ORDER BY g.title ASC ";
            break;
        case 'ALPHABETICAL_DESC':
            query += " ORDER BY g.title DESC ";
            break;
        case 'PRICE_ASC':
            query += " ORDER BY g.price ASC ";
            break;
        case 'PRICE_DESC':
            query += " ORDER BY g.price DESC ";
            break;
        case 'CREATED_ASC':
            query += " ORDER BY g.creation_date ASC ";
            break;
        case 'CREATED_DESC':
            query += " ORDER BY g.creation_date DESC ";
            break;
        case 'RATING_ASC':
            query += " ORDER BY rating ASC ";
            break;
        case 'RATING_DESC':
            query += " ORDER BY rating DESC ";
            break;
        default:
            query += " ORDER BY g.creation_date DESC ";
    }

    // Apply pagination: always add LIMIT and OFFSET now.
    const mainParams = [...baseParams];
    query += " LIMIT ? OFFSET ? ";
    mainParams.push(limit, startIndex);

    // Execute the main query.
    const [rows] = await conn.query(query, mainParams);
    const games = Array.isArray(rows)
        ? rows.map((row: any) => ({
            gameId: row.gameId,
            title: row.title,
            genreId: row.genreId,
            creatorId: row.creatorId,
            creatorFirstName: row.creatorFirstName,
            creatorLastName: row.creatorLastName,
            price: row.price,
            rating: parseFloat(row.rating),
            creationDate: row.creationDate,
            platformIds: row.platformIds
                ? row.platformIds.split(',').map((id: string) => parseInt(id, 10))
                : [],
        }))
        : [];

    conn.release();
    return { games, count: totalCount };
};



const getAllTitles = async (): Promise<[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT Title FROM game'
    const [ rows ] = await conn.query(query);
    await conn.release();
    return rows;
}

const getAllGenres = async(): Promise<Genre[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT id as genreId, name FROM genre';
    const [ rows ] = await conn.query(query);
    await conn.release();
    return rows;
}

const getAllPlatforms = async(): Promise<Platform[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT id as platformId, name FROM platform';
    const [ rows ] = await conn.query(query);
    await conn.release();
    return rows;
}

const getGameById = async(gameId: number): Promise<DetailedGame | null> => {
    const conn = await getPool().getConnection();
    const query = `
        SELECT
            g.id AS gameId,
            g.title,
            g.genre_id AS genreId,
            g.creator_id AS creatorId,
            u.first_name AS creatorFirstName,
            u.last_name AS creatorLastName,
            g.price,
            AVG(gr.rating) AS rating,
            g.creation_date AS creationDate,
            g.description,
            COUNT(DISTINCT o.id) AS numberOfOwners,
            COUNT(DISTINCT w.id) AS numberOfWishlists,
            GROUP_CONCAT(DISTINCT gp.platform_id) AS platformIds
        FROM game g
        LEFT JOIN user u ON g.creator_id = u.id
        LEFT JOIN game_platforms gp ON g.id = gp.game_id
        LEFT JOIN owned o ON g.id = o.game_id
        LEFT JOIN wishlist w ON g.id = w.game_id
        LEFT JOIN game_review gr ON g.id = gr.game_id
        WHERE g.id = ?
        GROUP BY g.id;
    `;
    const [ rows ] = await conn.query(query, [gameId]);
    conn.release();
    if ((rows as any[]).length === 0) {
        return null;
    }
    const row = (rows as any[])[0];
    const rating = row.rating ? parseFloat(row.rating) : 0;
    const platformIds = row.platformIds
        ? row.platformIds.split(",").map((id: string) => parseInt(id, 10))
        : [];
    const detailedGame: DetailedGame = {
        gameId: row.gameId,
        title: row.title,
        genreId: row.genreId,
        creatorId: row.creatorId,
        creatorFirstName: row.creatorFirstName,
        creatorLastName: row.creatorLastName,
        price: row.price,
        rating,
        platformIds,
        creationDate: row.creationDate,
        description: row.description,
        numberOfOwners: row.numberOfOwners,
        numberOfWishlists: row.numberOfWishlists
    };
    return detailedGame;
}

const createGame = async(newGame: Game, creatorId: number): Promise<number> => {
    const conn = await getPool().getConnection();
    const insertGameQuery = `
        INSERT INTO game (title, description, creation_date, creator_id, genre_id, price)
        VALUES (?, ?, NOW(), ?, ?, ?)
      `;
    const [ result ] = await conn.query(insertGameQuery, [
        newGame.title,
        newGame.description,
        creatorId,
        newGame.genreId,
        newGame.price,
    ]);
    const newGameId = result.insertId;
    const insertPlatformQuery = `
        INSERT INTO game_platforms (game_id, platform_id)
        VALUES (?, ?)
      `;
    for (const platformId of newGame.platformIds) {
        await conn.query(insertPlatformQuery, [ newGameId, platformId ]);
    }
    conn.release();
    return newGameId;
}

const updateGame = async (gameId: number, updatedData: Game): Promise<number> => {
    const conn = await getPool().getConnection();

    // Update the game record
    const updateGameQuery = `
      UPDATE game
      SET title = ?, description = ?, genre_id = ?, price = ?
      WHERE id = ?
    `;
    await conn.execute(updateGameQuery, [
        updatedData.title,
        updatedData.description,
        updatedData.genreId,
        updatedData.price,
        gameId,
    ]);
    // Remove existing platform associations
    const deletePlatformsQuery = `DELETE FROM game_platforms WHERE game_id = ?`;
    await conn.execute(deletePlatformsQuery, [gameId]);
    // Insert new platform associations
    const insertPlatformQuery = `
      INSERT INTO game_platforms (game_id, platform_id)
      VALUES (?, ?)
    `;
    // Commit the transaction
    await conn.release();
    return gameId;
};

const removeGame = async (gameId: number): Promise<void> => {
    const conn = await getPool().getConnection();
    try {
        // First, delete from game_platforms where game_id matches
        await conn.query(`DELETE FROM game_platforms WHERE game_id = ?`, [gameId]);
        // Then, delete the game row
        await conn.query(`DELETE FROM game WHERE id = ?`, [gameId]);
    } finally {
        conn.release();
    }
}


export { getAllGenres, getAllPlatforms, getGames, getGameById, getAllTitles, createGame, updateGame, removeGame };