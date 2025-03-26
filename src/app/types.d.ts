type User = {
    id?: number;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    authToken?: string;
    imageFilename?: string;
};

type Genre = {
    genreId: number;
    name: string;
};

type Platform = {
    platformId: number;
    name: string;
};

type Game = {
    id?: number;
    title: string;
    description: string;
    genreId: number;
    price: number;
    platformIds: number[];
    creationDate?: string;
    creatorId?: number;
    imageFilename?: string;
};

type DetailedGame = Game & {
    gameId: number;
    creatorId: number;
    creatorFirstName: string;
    creatorLastName: string;
    rating: number;
    creationDate: string;
    numberOfOwners: number;
    numberOfWishlists: number;
};

type GetAllGamesParams = {
    startIndex: number;
    count: number;
    q?: string;
    genreIds?: number[];
    price?: number;
    platformIds?: number[];
    creatorId?: number;
    reviewerId?: number;
    sortBy: string;
    ownedByMe: boolean;
    wishlistedByMe: boolean;
}

type Review = {
    reviewerId: number;
    rating: number;
    review: string;
    reviewerFirstName: string;
    reviewerLastName: string;
    timestamp: string;
}

type WishlistEntry = {
    id: number;
    game_id: number;
    user_id: number;
};

type OwnedEntry = {
    id: number;
    game_id: number;
    user_id: number;
};