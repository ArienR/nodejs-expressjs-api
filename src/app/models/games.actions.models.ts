import { getPool } from "../../config/db";

const getWishlistEntry = async (gameId: number, userId: number): Promise<WishlistEntry | null> => {
    const conn = await getPool().getConnection();
    const query = `
        SELECT *
        FROM wishlist
        WHERE game_id = ?
            AND user_id = ?
    `;
    const [ rows ] = await conn.query(query, [gameId, userId]);
    conn.release();
    if (Array.isArray(rows) && rows.length > 0) {
        return rows[0] as WishlistEntry;
    }
    return null;
}

const addGameWishlist = async (userId: number, gameId: number): Promise<void> => {
    const conn = await getPool().getConnection();
    const query = `
        INSERT INTO wishlist (game_id, user_id)
        VALUES (?, ?)`;
    await conn.query(query, [gameId, userId]);
    conn.release();
};


const getOwnedEntry = async (gameId: number, userId: number): Promise<OwnedEntry | null> => {
    const conn = await getPool().getConnection();
    const query = `
        SELECT *
        FROM owned
        WHERE game_id = ? AND user_id = ?
    `;
    const [rows] = await conn.query(query, [gameId, userId]);
    conn.release();
    if (Array.isArray(rows) && rows.length > 0) {
        return rows[0] as OwnedEntry;
    }
    return null;
};

const removeGameWishlist = async (gameId: number, userId: number): Promise<void> => {
    const conn = await getPool().getConnection();
    const query = `
        DELETE FROM wishlist
        WHERE game_id = ?
          AND user_id = ?`;
    await conn.query(query, [gameId, userId]);
    conn.release();
};

const addGameOwned = async (userId: number, gameId: number): Promise<void> => {
    const conn = await getPool().getConnection();
    const query = "INSERT INTO owned (game_id, user_id) VALUES (?, ?)";
    await conn.query(query, [gameId, userId]);
    conn.release();
};

const removeGameOwned = async (gameId: number, userId: number): Promise<void> => {
    const conn = await getPool().getConnection();
    const query = "DELETE FROM owned WHERE game_id = ? AND user_id = ?";
    await conn.query(query, [gameId, userId]);
    conn.release();
};

export { getWishlistEntry, addGameWishlist, getOwnedEntry, removeGameWishlist, addGameOwned, removeGameOwned };