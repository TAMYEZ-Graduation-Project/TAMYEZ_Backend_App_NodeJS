const archivedAllAggregatePipeline = ([
    {
        $match: {
            $and: [
                {
                    $or: [
                        { title: { $regex: "pre", $options: "i" } },
                        {
                            description: { $regex: "pre", $options: "i" },
                        },
                    ],
                },
                { quizzesIds: { $in: [new ObjectId("6973c467cf6173b110ca5133")] } },
            ],
        },
    },
    {
        $lookup: {
            from: "careers",
            localField: "careerId",
            foreignField: "_id",
            as: "careerDoc",
        },
    },
    {
        $match: {
            $or: [
                { "careerDoc.freezed": { $exists: true } },
                { freezed: { $exists: true } },
            ],
        },
    },
    {
        $facet: {
            result: [
                { $sort: { createdAt: -1 } },
                { $skip: 0 },
                { $limit: 10 },
                {
                    $project: { careerDoc: 0, courses: 0, youtubePlaylists: 0, books: 0 },
                },
            ],
            meta: [{ $count: "total" }],
        },
    },
    {
        $project: {
            total: { $ifNull: [{ $arrayElemAt: ["$meta.total", 0] }, 0] },
            result: 1,
        },
    },
]);
const archivedSpecificAggregatePipeline = ([
    {
        $match: { careerId: { $in: [new ObjectId("69715c15bfe5d5a096449da0")] } },
    },
    {
        $lookup: {
            from: "careers",
            localField: "careerId",
            foreignField: "_id",
            as: "careerDoc",
        },
    },
    {
        $match: {
            $or: [
                { "careerDoc.freezed": { $exists: true } },
                { freezed: { $exists: true } },
            ],
        },
    },
    {
        $facet: {
            result: [
                { $sort: { createdAt: -1 } },
                { $skip: 0 },
                { $limit: 10 },
                {
                    $project: { careerDoc: 0, courses: 0, youtubePlaylists: 0, books: 0 },
                },
            ],
            meta: [{ $count: "total" }],
        },
    },
    {
        $project: {
            total: { $ifNull: [{ $arrayElemAt: ["$meta.total", 0] }, 0] },
            result: 1,
        },
    },
]);
const notArchivedAllAggregatePipeline = ([
    {
        $lookup: {
            from: "careers",
            localField: "careerId",
            foreignField: "_id",
            as: "careerDoc",
        },
    },
    {
        $match: {
            $and: [
                { "careerDoc.freezed": { $exists: false } },
                { freezed: { $exists: false } },
            ],
        },
    },
    {
        $facet: {
            result: [
                { $sort: { createdAt: -1 } },
                { $skip: 0 },
                { $limit: 10 },
                {
                    $project: { careerDoc: 0, courses: 0, youtubePlaylists: 0, books: 0 },
                },
            ],
            meta: [{ $count: "total" }],
        },
    },
    {
        $project: {
            total: { $ifNull: [{ $arrayElemAt: ["$meta.total", 0] }, 0] },
            result: 1,
        },
    },
]);
const notArchivedSpecificAggregatePipeline = ([
    {
        $match: { careerId: { $in: [new ObjectId("69715c15bfe5d5a096449da0")] } },
    },
    {
        $lookup: {
            from: "careers",
            localField: "careerId",
            foreignField: "_id",
            as: "careerDoc",
        },
    },
    {
        $match: {
            $and: [
                { "careerDoc.freezed": { $exists: false } },
                { freezed: { $exists: false } },
            ],
        },
    },
    {
        $facet: {
            result: [
                { $sort: { createdAt: -1 } },
                { $skip: 0 },
                { $limit: 10 },
                {
                    $project: { careerDoc: 0, courses: 0, youtubePlaylists: 0, books: 0 },
                },
            ],
            meta: [{ $count: "total" }],
        },
    },
    {
        $project: {
            total: { $ifNull: [{ $arrayElemAt: ["$meta.total", 0] }, 0] },
            result: 1,
        },
    },
]);
export {};
