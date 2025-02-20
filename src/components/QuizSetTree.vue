<template>
    <div class="quiz-tree-container">
        <canvas ref="canvas" class="quiz-tree-canvas" @click="handleCanvasClick"></canvas>
    </div>
</template>

<script>
export default {
    // No changes to component options
};
</script>

<style scoped>
.quiz-tree-container {
    width: 100%;
    height: 400px;
    background: white;
    border-radius: 8px;
    padding: 10px;
}

.quiz-tree-canvas {
    width: 100%;
    height: 100%;
}

.preview-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.close-button {
    font-size: 1.5rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
}

.quiz-item-container {
    position: relative;
    padding-bottom: 3rem;
    border-bottom: 1px solid rgba(156, 163, 175, 0.2);
}

.edit-button-container {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
}

.edit-button {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background-color 0.2s;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .quiz-tree-container {
        background: #1F2937;
    }

    .modal-content {
        background: #1F2937;
        color: white;
    }

    .quiz-item-container {
        border-bottom-color: rgba(156, 163, 175, 0.1);
    }
}
</style>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import QuizItem from './QuizItem.vue';
import InProgress from './InProgress.vue';
import { quizEntries } from '../data/quiz-items';
import { useRouter } from 'vue-router';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const auth = useAuth();

const props = defineProps({
    publishedQuizSets: {
        type: Array,
        required: true
    },
    proposedQuizSets: {
        type: Array,
        required: true
    }
});

const emit = defineEmits(['select-quiz-set']);

const canvas = ref(null);
let ctx = null;
let nodePositions = []; // Store clickable areas

// Node styling
const styles = {
    rootNode: {
        color: '#4B5563', // gray-600
        height: 30,
        padding: 20,
        borderRadius: 12,
        font: 'bold 16px Inter'
    },
    publishedNode: {
        color: '#3B82F6', // blue-500
        height: 40,
        padding: 16,
        borderRadius: 10,
        font: '12px Inter',
        borderStyle: 'solid'
    },
    proposedNode: {
        color: '#F59E0B', // amber-500
        height: 40,
        padding: 16,
        borderRadius: 10,
        font: '12px Inter',
        borderStyle: 'dashed'
    },
    line: {
        color: '#E5E7EB', // gray-200
        width: 1.5
    }
};

// Helper function to draw a rounded rectangle
const drawRoundedRect = (x, y, width, height, radius, style) => {
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
};

// Get quiz item by ID
const getQuizItem = (id) => {
    return quizEntries.find(item => item.id === id);
};

// Handle canvas clicks
const handleCanvasClick = (event) => {
    const rect = canvas.value.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if click is within any node
    for (const node of nodePositions) {
        if (x >= node.x && x <= node.x + node.width &&
            y >= node.y && y <= node.y + node.height) {
            emit('select-quiz-set', node.set);
            break;
        }
    }
};

// Modified drawNode function to store clickable areas
const drawNode = (x, y, text, style, set = null) => {
    if (!ctx) return;

    // Calculate text dimensions
    ctx.font = style.font;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const nodeWidth = textWidth + (style.padding * 2);
    const nodeHeight = style.height;

    // Calculate node position (centered on x)
    const nodeX = x - (nodeWidth / 2);
    const nodeY = y - (nodeHeight / 2);

    // Store clickable area if this is a quiz set node
    if (set) {
        nodePositions.push({
            x: nodeX,
            y: nodeY,
            width: nodeWidth,
            height: nodeHeight,
            set
        });
    }

    // Draw background
    ctx.fillStyle = style.color;
    ctx.globalAlpha = 0.2;
    drawRoundedRect(nodeX, nodeY, nodeWidth, nodeHeight, style.borderRadius, style);
    ctx.fill();

    // Draw border
    ctx.globalAlpha = 1;
    ctx.strokeStyle = style.color;
    ctx.lineWidth = 2;
    if (style.borderStyle === 'dashed') {
        ctx.setLineDash([5, 3]);
    } else {
        ctx.setLineDash([]);
    }
    drawRoundedRect(nodeX, nodeY, nodeWidth, nodeHeight, style.borderRadius, style);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash pattern

    // Draw text
    ctx.fillStyle = style.color;
    ctx.font = style.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
};

// Draw a line between two points
const drawLine = (x1, y1, x2, y2, isDashed = false) => {
    if (!ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = styles.line.color;
    ctx.lineWidth = styles.line.width;
    if (isDashed) {
        ctx.setLineDash([5, 3]);
    } else {
        ctx.setLineDash([]);
    }
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash pattern
};

// Modified drawTree function
const drawTree = () => {
    if (!canvas.value || !ctx) return;

    // Clear node positions and canvas
    nodePositions = [];
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

    // Calculate dimensions
    const width = canvas.value.width;
    const height = canvas.value.height;
    const columnWidth = width / 3;

    // Filter out debug nodes and group by displayLevel
    const levelGroups = new Map();
    [...props.publishedQuizSets, ...props.proposedQuizSets]
        .filter(set => set.display !== "debug") // Filter out debug nodes
        .forEach(set => {
            const level = set.displayLevel || 0;
            if (!levelGroups.has(level)) {
                levelGroups.set(level, []);
            }
            levelGroups.get(level).push(set);
        });

    // Sort levels
    const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);

    // Calculate vertical spacing based on number of levels
    const startY = 40; // Reduced from headerY + 50 since we removed headers
    const levelSpacing = (height - startY) / (sortedLevels.length + 1);

    // Store node positions for drawing connections later
    const nodesByName = new Map();

    // Draw sets level by level
    sortedLevels.forEach((level, levelIndex) => {
        const y = startY + (levelIndex * levelSpacing);
        const setsInLevel = levelGroups.get(level);

        // Calculate horizontal spacing for items in this level
        const itemsInColumns = {
            1: setsInLevel.filter(set => (set.displayColumn || 1) === 1),
            2: setsInLevel.filter(set => set.displayColumn === 2),
            3: setsInLevel.filter(set => set.displayColumn === 3)
        };

        // Draw items in each column
        Object.entries(itemsInColumns).forEach(([column, sets]) => {
            if (sets.length === 0) return;

            const columnX = columnWidth * (parseInt(column) - 0.5);

            // Calculate maximum node width in this column
            let maxNodeWidth = 0;
            sets.forEach(set => {
                ctx.font = styles.publishedNode.font;
                const textMetrics = ctx.measureText(set.setName);
                const nodeWidth = textMetrics.width + (styles.publishedNode.padding * 2);
                maxNodeWidth = Math.max(maxNodeWidth, nodeWidth);
            });

            // Calculate minimum spacing between nodes to prevent overlap
            const minSpacing = maxNodeWidth + 20; // Add 20px buffer
            const totalWidth = (sets.length - 1) * minSpacing;
            const startX = columnX - (totalWidth / 2);

            sets.forEach((set, setIndex) => {
                const isProposed = props.proposedQuizSets.includes(set);
                const offsetX = startX + (setIndex * minSpacing);

                // Draw node
                drawNode(offsetX, y, set.setName, isProposed ? styles.proposedNode : styles.publishedNode, set);

                // Store node position for connections
                nodesByName.set(set.setName, {
                    x: offsetX,
                    y: y,
                    isProposed: isProposed,
                    set: set
                });
            });
        });
    });

    // Draw connections based on children field
    nodesByName.forEach((node, setName) => {
        const set = node.set;
        if (set.children && Array.isArray(set.children)) {
            set.children.forEach(childName => {
                const childNode = nodesByName.get(childName);
                if (childNode) {
                    // Draw line from parent to child
                    drawLine(
                        node.x,
                        node.y + (styles.publishedNode.height / 2),
                        childNode.x,
                        childNode.y - (styles.publishedNode.height / 2),
                        childNode.isProposed
                    );
                }
            });
        }
    });
};

// Handle canvas resize
const resizeCanvas = () => {
    if (!canvas.value) return;

    const container = canvas.value.parentElement;
    canvas.value.width = container.clientWidth;
    canvas.value.height = 400; // Fixed height or adjust as needed

    // Update context and redraw
    ctx = canvas.value.getContext('2d');
    drawTree();
};

// Initialize canvas
onMounted(() => {
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
});

// Watch for changes in quiz sets
watch([() => props.publishedQuizSets, () => props.proposedQuizSets], () => {
    drawTree();
}, { deep: true });

// Function to check if an item is a draft owned by the current user
const isUserOwnedDraft = (itemId) => {
    const item = getQuizItem(itemId);
    return item?.isDraft && item?.createdBy === auth.user?.uid;
};

// Function to get the appropriate button label
const getEditButtonLabel = (itemId) => {
    if (isUserOwnedDraft(itemId)) {
        return 'Edit';
    }
    return 'Propose Changes';
};

// Handle edit button click
const handleEditClick = async (itemId) => {
    const item = getQuizItem(itemId);

    if (isUserOwnedDraft(itemId)) {
        // Navigate directly to edit the draft
        router.push(`/edit-item/${itemId}`);
    } else {
        try {
            // Create a copy of the item for proposing changes
            const itemCopy = {
                ...item,
                originalId: itemId,
                isDraft: true,
                createdBy: auth.user?.uid || 'anonymous',
                createdAt: new Date().toISOString(),
                status: 'proposed'
            };

            // Save to Firebase
            const docRef = await addDoc(collection(db, 'proposedQuizItems'), itemCopy);

            // Navigate to edit the new copy
            router.push(`/edit-item/${docRef.id}`);
        } catch (error) {
            console.error('Error creating proposal:', error);
            alert('Failed to create proposal. Please try again.');
        }
    }
};
</script>