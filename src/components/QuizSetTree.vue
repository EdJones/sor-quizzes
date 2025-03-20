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
    min-height: 200px;
    height: auto;

    /* Adjust height for mobile */
    @media (max-width: 768px) {
        min-height: 300px;
    }

    background: rgb(31, 41, 55);
    border-radius: 8px;
    padding: 10px;
    overflow: visible;
    /* Changed from hidden to allow content to determine height */
}

.quiz-tree-canvas {
    width: 100%;
    height: 100%;
    min-height: inherit;
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
    background: rgb(31, 41, 55);
    padding: 2rem;
    border-radius: 8px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    color: white;
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
        color: '#4B5563',
        height: 40,
        padding: 12,
        borderRadius: 12,
        font: 'bold 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    publishedNode: {
        color: '#3B82F6',
        height: window.innerWidth <= 768 ? 50 : 60,
        padding: window.innerWidth <= 768 ? 10 : 12,
        borderRadius: 12,
        font: window.innerWidth <= 768 ? '16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            : '18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderStyle: 'solid',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        iconSize: window.innerWidth <= 768 ? 20 : 24
    },
    proposedNode: {
        color: '#F59E0B',
        height: window.innerWidth <= 768 ? 50 : 60,
        padding: window.innerWidth <= 768 ? 10 : 12,
        borderRadius: 12,
        font: window.innerWidth <= 768 ? '16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            : '18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderStyle: 'dashed',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        iconSize: window.innerWidth <= 768 ? 20 : 24
    },
    line: {
        color: '#E5E7EB',
        width: 2
    }
};

// Update resize handler with new dimensions
window.addEventListener('resize', () => {
    styles.publishedNode.height = window.innerWidth <= 768 ? 50 : 60;
    styles.publishedNode.padding = window.innerWidth <= 768 ? 10 : 12;
    styles.publishedNode.font = window.innerWidth <= 768
        ? '16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        : '18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    styles.publishedNode.iconSize = window.innerWidth <= 768 ? 20 : 24;

    styles.proposedNode.height = window.innerWidth <= 768 ? 50 : 60;
    styles.proposedNode.padding = window.innerWidth <= 768 ? 10 : 12;
    styles.proposedNode.font = window.innerWidth <= 768
        ? '16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        : '18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    styles.proposedNode.iconSize = window.innerWidth <= 768 ? 20 : 24;

    if (canvas.value) {
        drawTree();
    }
});

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

// Add new function to draw quiz set icon
const drawQuizIcon = (x, y, size, color) => {
    if (!ctx) return;

    // Save current context state
    ctx.save();

    // Set icon styles
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = color;

    // Draw a simplified quiz/document icon
    const iconX = x - size / 2;
    const iconY = y - size / 2;

    // Draw main rectangle (document body)
    ctx.beginPath();
    ctx.rect(iconX, iconY, size * 0.8, size);
    ctx.stroke();

    // Draw lines representing text
    const lineSpacing = size * 0.2;
    const lineWidth = size * 0.5;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(iconX + size * 0.15, iconY + size * 0.25 + (i * lineSpacing));
        ctx.lineTo(iconX + size * 0.15 + lineWidth, iconY + size * 0.25 + (i * lineSpacing));
        ctx.stroke();
    }

    // Restore context state
    ctx.restore();
};

// Update drawNode function to move content closer to top
const drawNode = (x, y, text, style, set = null) => {
    if (!ctx) return;

    // Calculate text dimensions
    ctx.font = style.font;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const nodeWidth = textWidth + (style.padding * 2.5) + style.iconSize; // Further reduced padding
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

    // Draw background with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = style.backgroundColor || 'rgba(255, 255, 255, 0.1)';
    drawRoundedRect(nodeX, nodeY, nodeWidth, nodeHeight, style.borderRadius, style);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

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

    // Calculate vertical offset for top alignment (about 30% from top)
    const verticalOffset = nodeHeight * 0.3;

    // Draw icon (moved closer to top)
    const iconSize = style.iconSize;
    drawQuizIcon(nodeX + style.padding + iconSize / 2, nodeY + verticalOffset, iconSize, style.color);

    // Draw text (closer to top, aligned with icon)
    ctx.fillStyle = style.color;
    ctx.font = style.font;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, nodeX + style.padding * 1.2 + iconSize, nodeY + verticalOffset);

    // Draw item count if available (adjusted position)
    if (set && set.items) {
        const itemCount = `${set.items.length} items`;
        const itemCountFont = window.innerWidth <= 768
            ? '14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            : '16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.font = itemCountFont;
        ctx.fillStyle = style.color;
        ctx.globalAlpha = 0.7;
        ctx.fillText(itemCount, nodeX + style.padding * 1.2 + iconSize, nodeY + nodeHeight * 0.7);
        ctx.globalAlpha = 1;
    }
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
    const columnWidth = width / 3;
    const minNodeSpacing = window.innerWidth <= 768 ? 10 : 12; // Reduced spacing
    const startY = window.innerWidth <= 768 ? 35 : 40; // Increased top margin to accommodate root node

    // Group and filter sets
    const levelGroups = new Map();
    [...props.publishedQuizSets, ...props.proposedQuizSets]
        .filter(set => set.display !== "debug")
        .forEach(set => {
            const level = set.displayLevel || 0;
            if (!levelGroups.has(level)) {
                levelGroups.set(level, []);
            }
            levelGroups.get(level).push(set);
        });

    const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);

    // Calculate total height needed
    let maxHeight = startY * 1.5; // Increased initial height for top padding
    const levelHeights = new Map(); // Store height needed for each level

    // First pass: calculate height needed for each level
    sortedLevels.forEach(level => {
        const setsInLevel = levelGroups.get(level);
        const columnHeights = [0, 0, 0]; // Track height for each column

        // Calculate height needed for each column in this level
        setsInLevel.forEach(set => {
            const column = (set.displayColumn || 1) - 1;
            columnHeights[column] += styles.publishedNode.height + minNodeSpacing;
        });

        // Use the tallest column height for this level
        const levelHeight = Math.max(...columnHeights);
        levelHeights.set(level, levelHeight);
        maxHeight += levelHeight;
    });

    // Add padding to maxHeight
    maxHeight += minNodeSpacing;

    // Update canvas height if needed
    if (canvas.value.height < maxHeight) {
        canvas.value.height = maxHeight;
        // Also update container height to match content
        canvas.value.parentElement.style.height = `${maxHeight}px`;
    }

    // Draw sets level by level
    let currentY = startY;
    const nodesByName = new Map();

    sortedLevels.forEach(level => {
        const setsInLevel = levelGroups.get(level);
        const levelHeight = levelHeights.get(level);

        // Group sets by column
        const itemsInColumns = {
            1: setsInLevel.filter(set => (set.displayColumn || 1) === 1),
            2: setsInLevel.filter(set => set.displayColumn === 2),
            3: setsInLevel.filter(set => set.displayColumn === 3)
        };

        // Draw items in each column
        Object.entries(itemsInColumns).forEach(([column, sets]) => {
            if (sets.length === 0) return;

            const columnX = columnWidth * (parseInt(column) - 0.5);
            let nodeY = currentY;

            sets.forEach(set => {
                // Calculate node dimensions
                ctx.font = styles.publishedNode.font;
                const textMetrics = ctx.measureText(set.setName);
                const nodeWidth = textMetrics.width + (styles.publishedNode.padding * 2);

                // Check if node would overflow column width
                if (nodeWidth > columnWidth - 20) {
                    ctx.font = '10px Inter';
                }

                // Draw node
                const isProposed = props.proposedQuizSets.includes(set);
                drawNode(columnX, nodeY, set.setName, isProposed ? styles.proposedNode : styles.publishedNode, set);

                // Store node position for connections
                nodesByName.set(set.setName, {
                    x: columnX,
                    y: nodeY,
                    isProposed: isProposed,
                    set: set
                });

                // Update Y position for next node with reduced spacing
                nodeY += styles.publishedNode.height + minNodeSpacing;
            });
        });

        // Move to next level
        currentY += levelHeight;
    });

    // Draw connections
    nodesByName.forEach((node, setName) => {
        const set = node.set;
        if (set.children && Array.isArray(set.children)) {
            set.children.forEach(childName => {
                const childNode = nodesByName.get(childName);
                if (childNode) {
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

// Update resizeCanvas function to ensure minimum height
const resizeCanvas = () => {
    if (!canvas.value) return;

    const container = canvas.value.parentElement;
    canvas.value.width = container.clientWidth;

    // Set initial height to accommodate top nodes
    canvas.value.height = Math.max(300, container.clientHeight); // Increased minimum height

    // Update context and redraw
    ctx = canvas.value.getContext('2d');
    drawTree();
};

// Initialize canvas
onMounted(() => {
    window.addEventListener('resize', resizeCanvas);
    if (canvas.value) {
        canvas.value.parentElement.style.minHeight = '300px'; // Ensure minimum container height
    }
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