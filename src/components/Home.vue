<template>
    <div class="container mx-auto px-4">
        <div v-if="showQuizzes">

            <div class="sm:w-full md:w-9/12 lg:w-5/6 lg:px-4 quizzes-container text-center">
                <div class="mt-16 grid quiz-item w-full border-4 place-self-center place-content-center text-center">
                    <p class="h2 mt-8">We're just getting started, but for now...</p>
                    <p class="font-bold text-sky-900 h2">Choose a role / level of difficulty:</p>
                    <div class="sm:mt-4 mt-2 mb-2 gap-8 columns-1">
                        <div><button @click="showQuiz(6)" class="lg:text-3xl sm:text-2xl px-4 py-1">Why Care?</button>
                        </div>
                    </div>
                    <div class="mt-2 mb-2 gap-8 columns-2">
                        <div><button @click="showQuiz(1)" class="lg:text-3xl sm:text-2xl px-4 py-1">Expert</button>
                        </div>
                        <div><button @click="showQuiz(0)" class="lg:text-3xl sm:text-2xl px-4 py-1">Basic</button></div>
                    </div>
                    <div class="mt-2 mb-2 gap-8 columns-2">
                        <div><button @click="showQuiz(3)"
                                class="place-self-center place-content-center lg:text-3xl sm:text-2xl px-4 py-1">Kinder-First</button>
                        </div>
                        <div><button @click="showQuiz(4)"
                                class="place-self-center place-content-center lg:text-3xl sm:text-2xl px-4 py-1">Admin,
                                Board
                                Members</button></div>
                    </div>
                    <div v-if="debug" class="mt-2 mb-8">
                        <button @click="showQuiz(5)"
                            class="place-self-center place-content-center lg:text-3xl sm:text-2xl">Test
                            Expert</button>
                    </div>
                    <div class="mt-2 mb-2">
                        <button @click="showQuiz(7)"
                            class="place-self-center place-content-center lg:text-2xl sm:text-xl  px-4 py-1">Learning
                            Science</button>
                    </div>
                    <div class="mt-2 mb-8">
                        <button @click="showQuiz(2)"
                            class="place-self-center place-content-center lg:text-2xl sm:text-xl  px-4 py-1">New Quiz
                            Items</button>
                    </div>
                </div>
            </div>
            <div class="mt-8 w-full place-content-center">
                <div class="router-link-container">
                    <router-link to="/QuizSetView" class="button-75">Contribute to these quizzes</router-link>
                </div>
                <div class="router-link-container mt-4">
                    <p class="h3 mt-4">SOR Quizzes is a <router-link to="/about" class=" hover:text-sky-700">community
                            driven
                            effort</router-link>.</p>
                </div>


            </div>
        </div>
        <div v-else-if="showInProgress">
            <InProgress :selectedQuiz="selectedQuiz" @change-view="handleChangeView" />
        </div>
        <div v-else>
            <Quiz @change-view="handleChangeView" :selectedQuiz="selectedQuiz" :debug="debug"></Quiz>
        </div>
    </div>
</template>

<script>
import Quiz from './Quiz.vue';
import InProgress from './InProgress.vue';
import { quizStore } from '../stores/quizStore';
import { quizSets } from '../data/quizSets'; // Import quizSets

export default {
    name: 'Home',
    components: {
        Quiz,
        InProgress
    },
    data() {
        return {
            showQuizzes: true,
            selectedQuiz: 100000,
            quiz: quizStore(),
            quizSets: quizSets, // Add quizSets to data if needed
            debug: false,
            showInProgress: false,  // Add this if not already present
            showEnd: false  // Add this if not already present
        }
    },
    methods: {
        showQuiz(quizNum) {
            console.info("Quiz selected: ", quizNum);
            this.showQuizzes = false;
            this.selectedQuiz = quizNum;
            if (this.quizSets[quizNum].inProgress) {
                this.showInProgress = true;
            } else {
                this.selectedQuiz = quizNum;
                const startTime = Math.floor(Date.now() / 1000);
                this.quiz.recordQuizAttempt(startTime);
            }
        },
        handleChangeView(view) {
            this.showQuizzes = view.showQuizzes;
            this.showInProgress = view.showInProgress;
            this.showEnd = view.showEnd;

            if (view.showQuizzes) {
                this.selectedQuiz = null;
            }
        }
    }
}
</script>

<style>
.quizzes-container {
    display: flex;
    margin-left: auto;
    margin-right: auto;
    justify-content: space-evenly;
    flex-flow: column nowrap;
}

.quiz-item {
    border-style: solid;
    border-top-right-radius: 2dvw;
    border-radius: 2dvw;
}

.lead-image {
    width: 50;
    height: 50;
}



/* CSS */
.button-75 {
    align-items: center;
    background-image: linear-gradient(90deg, #4a7ff3 40%, #702afa);
    border: 0;
    border-radius: 10px;
    box-sizing: border-box;
    color: #fff;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    font-family: "Codec cold", sans-serif;
    font-size: 12px;
    font-weight: 100;
    height: 24px;
    justify-content: center;
    letter-spacing: .4px;
    line-height: 1;
    max-width: fit-content;
    padding-left: 10px;
    padding-right: 10px;
    padding-top: 3px;
    margin-top: 10px;
    text-decoration: none;
    text-transform: uppercase;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
}

.button-75:active {
    outline: 0;
}

.button-75:hover {
    outline: 0;
}

.button-75 span {
    transition: all 200ms;
}

.button-75:hover span {
    transform: scale(.9);
    opacity: .75;
}

@media screen and (max-width: 991px) {
    .button-75 {
        font-size: 15px;
        height: 24px;
    }

    .button-75 span {
        line-height: 24px;
    }
}

/* Add any other styles that were previously in App.vue and are needed for the Home component */

.router-link-container {
    display: flex;
    justify-content: center;
    margin-top: 10px;
}
</style>
