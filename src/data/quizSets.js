export const quizSets = [
    {
        setName: "general",
        basicMode: true,
        items: [10, 22, 11, 14, 21, 4, 6, 12, 13, 3],
        displayLevel: 1,
        displayColumn: 1,
        children: []
    },
    {
        setName: "expert",
        basicMode: false,
        items: [2, 1, 5, 4, 6, 15, 16, 17, 18, 19],
        displayLevel: 1,
        displayColumn: 1,
        children: []
    },
    {
        setName: "New Items",
        beta: true,
        basicMode: true,
        items: [43, 44, 45],
        displayLevel: 2,
        displayColumn: 1,
        children: []
    },
    {
        setName: "kinder-first",
        basicMode: true,
        items: [23, 42, 41, 24, 26, 25, 11],
        displayLevel: 1,
        displayColumn: 2,
        children: []
    },
    {
        setName: "admin",
        basicMode: true,
        items: [14, 30, 28, 18, 29, 32, 16, 27, 31],
        displayLevel: 1,
        displayColumn: 3,
        children: []
    },
    {
        setName: "test-expert",
        basicMode: false,
        inProgress: true,
        items: [2, 1, 5],
        displayLevel: 3,
        displayColumn: 1,
        display: "debug",
        children: []
    },
    {
        setName: "Why Care?",
        basicMode: true,
        items: [34, 35, 37, 36, 38],
        displayLevel: 0,
        children: []
    },
    {
        setName: "Learning Science",
        basicMode: true,
        items: [42],
        inProgress: true,
        displayLevel: 2,
        displayColumn: 1,
        children: [],
        podcastEpisodes: [{
            title: "Why the science of reading needs the science of learning",
            EpisodeUrl: "https://lnns.co/njyfzcC9hg0",
            audioUrl: "/audio/geiger.mp3",
            description: "'The science of reading tells us WHAT to teach... The science of learning tells us HOW to teach...' - Anna Geiger",
            podcastStartTime: 0,
        },
        {
            title: "S4E18: Blake Harvard on Attention and Memory Constraints",
            EpisodeUrl: "https://educationrickshaw.com/2025/01/14/s4e18-blake-harvard-on-attention-and-memory-constraints/",
            audioUrl: "https://educationrickshaw.com/wp-content/uploads/2025/01/blake-final-edit-1.mp3",
            description: "A quick overview of the science of reading and how it relates to attention and memory constraints.",
            podcastStartTime: 173,
        }]
    },
    {
        setName: "Legislation and Policy",
        basicMode: true,
        items: [40],
        inProgress: true,
        displayLevel: 1,
        displayColumn: 3,
        children: [],
        resource: {
            title: "Science of Reading (SoR) Legislation and Implementation State Scan ",
            url: "https://learning.ccsso.org/science-of-reading-legislation-and-implementation-state-scan",
            description: "This guide provides a comprehensive overview of the science of reading, including its key principles, research findings, and implications for education policy and practice.",
            resourceType: "PDF",
            resourceUrl: "https://www.education.gov.au/sites/default/files/documents/2024/09/19/science-of-reading-guide-for-educators.pdf",
        },
        podcastEpisodes: [{
            title: "Why the science of reading needs the science of learning",
            EpisodeUrl: "https://lnns.co/njyfzcC9hg0",
            audioUrl: "/audio/geiger.mp3",
            description: "'The science of reading tells us WHAT to teach... The science of learning tells us HOW to teach...' - Anna Geiger",
            podcastStartTime: 0,
        }]
    },
    {
        setName: "3rd-5th grade",
        basicMode: true,
        items: [41],
        inProgress: true,
        displayLevel: 1,
        displayColumn: 2,
        children: [],
        podcastEpisodes: [{
            title: "",
            EpisodeUrl: "",
            audioUrl: "",
            description: "",
            podcastStartTime: 0,
        }]
    },
    {
        setName: "Repeated Reading",
        basicMode: true,
        items: [41],
        inProgress: true,
        displayLevel: 2,
        displayColumn: 2,
        children: [],
        inProgressText: "We put this here to show the deeper areas the quizzes should go in to. Do you know what content belongs here?",
        resource: {
            title: "",
            url: "https://www.facebook.com/groups/704498996666615/permalink/2098428430606991/?mibextid=wwXIfr&rdid=1wqUY6YtQWPFMeu8",
            description: "'How do you guys do repeated reading? I was doing the UFLI passages and...'",
            resourceType: "Facebook Post",
            resourceUrl: "https://www.facebook.com/groups/704498996666615/permalink/2098428430606991/",
        },
        podcastEpisodes: [{
            title: "",
            EpisodeUrl: "",
            audioUrl: "",
            description: "",
            podcastStartTime: 0,
        }]
    }
];
