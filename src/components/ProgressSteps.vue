<template>
    <div class="progress-steps">
        <div class="step" :class="{
            'active': currentStep >= 1,
            'complete': currentStep > 1,
            'current': currentStep === 1
        }">
            <div class="step-content">
                <div class="step-number">1</div>
                <div class="step-label">Question</div>
            </div>
            <div class="step-line" :class="{ 'active': currentStep > 1 }"></div>
        </div>
        <div class="step" :class="{
            'active': currentStep >= 2,
            'complete': currentStep > 2,
            'current': currentStep === 2
        }">
            <div class="step-content">
                <div class="step-number">2</div>
                <div class="step-label">Answers</div>
            </div>
            <div class="step-line" :class="{ 'active': currentStep > 2 }"></div>
        </div>
        <div class="step" :class="{
            'active': currentStep >= 3,
            'complete': currentStep > 3,
            'current': currentStep === 3
        }">
            <div class="step-content">
                <div class="step-number">3</div>
                <div class="step-label">Explanation</div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ProgressSteps',
    props: {
        currentStep: {
            type: Number,
            default: 1,
            validator: (value) => value >= 0 && value <= 3
        }
    }
}
</script>

<style scoped>
.progress-steps {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 2rem auto;
    position: relative;
    max-width: 600px;
    padding: 0 1rem;
}

.step {
    display: flex;
    align-items: center;
    position: relative;
    flex: 1;
}

.step-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
}

.step-number {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background-color: #1f2937;
    border: 2px solid #4b5563;
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    transition: all 0.3s ease;
    margin-bottom: 0.5rem;
    position: relative;
}

.step-label {
    font-size: 0.875rem;
    color: #9ca3af;
    transition: color 0.3s ease;
    white-space: nowrap;
}

.step-line {
    position: absolute;
    left: 50%;
    right: -50%;
    height: 2px;
    background-color: #4b5563;
    transition: background-color 0.3s ease;
    top: 1.25rem;
}

.step.active .step-number {
    background-color: #1f2937;
    border-color: #3b82f6;
    color: #3b82f6;
}

.step.active .step-label {
    color: #3b82f6;
}

.step.complete .step-number {
    background-color: #3b82f6;
    border-color: #3b82f6;
    color: white;
}

.step.current .step-number {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

.step-line.active {
    background-color: #3b82f6;
}

/* Dark mode enhancements */
@media (prefers-color-scheme: dark) {
    .progress-steps {
        --bg-color: #111827;
    }

    .step-number {
        background-color: #111827;
        border-color: #374151;
    }

    .step-line {
        background-color: #374151;
    }

    .step.active .step-number {
        background-color: #111827;
    }
}
</style>