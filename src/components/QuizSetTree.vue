<template>
    <div class="quiz-tree-container">
        <canvas ref="canvas" class="quiz-tree-canvas"></canvas>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

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
let ctx = null;

// Node styling
const styles = {
    rootNode: {
        color: '#4B5563', // gray-600
        radius: 40,
        font: '14px Inter'
    },
    publishedNode: {
        color: '#3B82F6', // blue-500
        radius: 30,
        font: '12px Inter',
        borderStyle: 'solid'
    },
    proposedNode: {
        color: '#F59E0B', // amber-500
        radius: 30,
        font: '12px Inter',
        borderStyle: 'dashed'
    },
    line: {
        color: '#9CA3AF', // gray-400
        width: 2
    }
};

// Draw a node with text
const drawNode = (x, y, text, style) => {
    if (!ctx) return;

    // Draw circle
    ctx.beginPath();
    ctx.fillStyle = style.color;
    ctx.globalAlpha = 0.2;
    ctx.arc(x, y, style.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw border
    ctx.globalAlpha = 1;
    ctx.strokeStyle = style.color;
    ctx.lineWidth = 2;
    if (style.borderStyle === 'dashed') {
        ctx.setLineDash([5, 3]); // Create dashed line pattern
    } else {
        ctx.setLineDash([]); // Reset to solid line
    }
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash pattern

    // Draw text
    ctx.fillStyle = style.color;
    ctx.font = style.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Wrap text if needed
    const words = text.split(' ');
    let line = '';
    let lines = [];
    for (let word of words) {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > style.radius * 1.8) {
            lines.push(line);
            line = word + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    // Draw each line of text
    lines.forEach((line, i) => {
        const lineHeight = 14;
        const offset = (lines.length - 1) * lineHeight / 2;
        ctx.fillText(line.trim(), x, y + i * lineHeight - offset);
    });
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

// Main drawing function
const drawTree = () => {
    if (!canvas.value || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

    // Calculate dimensions
    const width = canvas.value.width;
    const height = canvas.value.height;

    // Root node position
    const rootX = width / 2;
    const rootY = 60;

    // Draw root node
    drawNode(rootX, rootY, 'Quiz Sets', styles.rootNode);

    // Calculate positions for quiz set nodes
    const level2Y = rootY + 120;
    const spacing = width / (props.publishedQuizSets.length + props.proposedQuizSets.length + 1);
    let currentX = spacing;

    // Draw published quiz sets
    props.publishedQuizSets.forEach((set, i) => {
        drawNode(currentX, level2Y, set.setName, styles.publishedNode);
        drawLine(rootX, rootY + styles.rootNode.radius, currentX, level2Y - styles.publishedNode.radius);
        currentX += spacing;
    });

    // Draw proposed quiz sets
    props.proposedQuizSets.forEach((set, i) => {
        drawNode(currentX, level2Y, set.setName, styles.proposedNode);
        drawLine(rootX, rootY + styles.rootNode.radius, currentX, level2Y - styles.proposedNode.radius, true);
        currentX += spacing;
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

<style scoped>
.quiz-tree-container {
    width: 100%;
    height: 400px;
    background: white;
    border-radius: 8px;
    padding: 16px;
}

.quiz-tree-canvas {
    width: 100%;
    height: 100%;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .quiz-tree-container {
        background: #1F2937;
    }
}
</style>