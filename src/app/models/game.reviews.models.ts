import { getPool } from "../../config/db";

const getReviews = async (gameId: number): Promise<Review[]> => {
    const conn = await getPool().getConnection();
    // INNER JOIN as every review is associated with a user
    const query = `
    SELECT
        u.id as reviewerId,
        gr.rating,
        gr.review,
        u.first_name as reviewerFirstName,
        u.last_name as reviewerLastName,
        gr.timestamp
    FROM
        game_review gr
        INNER JOIN user u ON u.id = gr.user_id
    WHERE
        gr.game_id = ${gameId}
    ORDER BY
        gr.timestamp DESC`;
    const [ rows ] = await conn.query(query);
    await conn.release();
    return rows;
}

const createReview = async (
    gameId: number,
    userId: number,
    rating: number,
    review?: string
): Promise<void> => {
    const conn = await getPool().getConnection();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const query = `
    INSERT INTO game_review (game_id, user_id, rating, review, timestamp)
    VALUES (?, ?, ?, ?, ?)
    `;
    await conn.query(query, [gameId, userId, rating, review || null, now]);
    await conn.release();
}


export { getReviews, createReview };