<template>
    <div class="quiz-tree-container">
        <canvas ref="canvas" class="quiz-tree-canvas" @click="handleCanvasClick"></canvas>

        <!-- Preview Modal -->
        <div v-if="selectedSet" class="preview-modal" @click="selectedSet = null">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3 class="text-xl font-bold mb-4">{{ selectedSet.setName }}</h3>
                    <button @click="selectedSet = null" class="close-button">×</button>
                </div>
                <div class="modal-body">
                    <div v-for="itemId in selectedSet.items" :key="itemId" class="mb-6">
                        <QuizItem :currentQuizItem="getQuizItem(itemId)" :itemNum="0" :reviewMode="false"
                            :basicMode="selectedSet.basicMode" :debug="false" :userAnswer="null" />
                    </div>
                </div>
            </div>
        </div>
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

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .quiz-tree-container {
        background: #1F2937;
    }

    .modal-content {
        background: #1F2937;
        color: white;
    }
}
</style>

<script setup>
import { ref, onMounted, watch } from 'vue';
import QuizItem from './QuizItem.vue';
import { quizEntries } from '../data/quiz-items';

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

const canvas = ref(null);
const selectedSet = ref(null);
let ctx = null;
let nodePositions = []; // Store clickable areas

// Node styling
const styles = {
    rootNode: {
        color: '#4B5563', // gray-600
        height: 50,
        padding: 20,
        borderRadius: 12,
        font: '14px Inter'
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
            selectedSet.value = node.set;
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

    // Root node position
    const rootX = width / 2;
    const rootY = 60;

    // Draw root node
    drawNode(rootX, rootY, 'Quiz Sets', styles.rootNode);

    // Group sets by display level
    const levelSets = [...props.publishedQuizSets, ...props.proposedQuizSets].reduce((acc, set) => {
        const level = set.displayLevel;
        if (!acc[level]) acc[level] = [];
        acc[level].push(set);
        return acc;
    }, {});

    // Calculate vertical spacing
    const maxLevel = Math.max(...Object.keys(levelSets).map(Number));
    const verticalSpacing = (height - rootY - styles.rootNode.height) / (maxLevel + 2);

    // Draw each level
    Object.entries(levelSets).forEach(([level, sets]) => {
        const y = rootY + ((Number(level) + 1) * verticalSpacing);
        const horizontalSpacing = width / (sets.length + 1);

        sets.forEach((set, index) => {
            const x = horizontalSpacing * (index + 1);
            const isProposed = props.proposedQuizSets.includes(set);

            // Draw node
            drawNode(x, y, set.setName, isProposed ? styles.proposedNode : styles.publishedNode, set);

            // Draw connecting line to root
            drawLine(
                rootX,
                rootY + (styles.rootNode.height / 2),
                x,
                y - (styles.publishedNode.height / 2),
                isProposed
            );
        });
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
</script>