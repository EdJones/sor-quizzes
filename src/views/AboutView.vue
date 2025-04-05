<template>
    <div class="about-container">
        <div class="flex justify-between">
            <h1>&nbsp;</h1>
            <h1 class="flex justify-center">About </h1> <img src="../assets/partners.png" alt="SOR"
                class="flex justify-end w-32 h-32 mr-20 object-scale-down">
        </div>

        <section class="about-section">
            <h2>A community-driven, open-source effort.</h2>
            <ul>
                <li class="list-none">
                    <p @click="showOpenSourceModal" class="text-blue-400 hover:text-blue-300">
                        <span class="text-blue-400 hover:text-blue-300">What is a Culture of Open Source?</span>
                    </p>
                </li>
            </ul>

        </section>

        <section class="about-section">
            <h2>Origins</h2>
            <p>
                The Science of Reading community has a source of truth problem:
            </p>
            <ul>
                <li>
                    <a href="https://righttoreadproject.com/2024/07/06/hoping-for-the-best-is-not-a-viable-strategy/"
                        target="_blank">Hoping for the Best Is Not a Viable Strategy</a> <span
                        class="text-sm text-gray-300">Margaret Goldberg</span>
                </li>
                <li>
                    <a href="https://www.aei.org/education/the-science-of-reading-is-on-a-winning-streak-and-thats-a-problem/"
                        target="_blank">The "Science of Reading" Is on a Winning
                        Streak. And That's a Problem.</a> <span class="text-sm text-gray-300">Robert Pondiscio</span>
                </li>
                <li>
                    <a href="https://seidenbergreading.net/2024/06/24/where-does-the-science-of-reading-go-from-here-2/"
                        target="_blank">Where does the Science of Reading go from here?</a> <span
                        class="text-sm text-gray-300">Mark Seidenberg</span>
                </li>
            </ul>

            Today, teachers are hard-pressed to find the most current, evidence-based information about the science
            of reading and structured literacy practices.

        </section>

        <section class="about-section">
            <h2>Contributing</h2>
            <p>
                This app will only make sense when validated and refined by the community.
            </p>
            <p>
                Please consider <router-link to="/QuizSetView" class="">making this better</router-link>.
            </p>
            <ul>
                <li class="list-none text-xs">Repository: <a
                        href="https://github.com/EdJones/sor-quizzes">github.com/EdJones/sor-quizzes</a>
                </li>
            </ul>

        </section>




        <section class="about-section donation-box">
            <h2>Support This App</h2>
            <p>
                I built this as a gift to the structured literacy community and the young learners it can help.
            </p>
            <p>
                While mine is the vision behind
                <a href="https://skunkworks-edu.com">Skunkworks\edu</a>,
                I've never
                been paid
                for work in K12.
            </p>
            <p>
                Can you help me attend Research Ed events or pay the expenses of this app?
            </p>
            <div class="flex justify-end mr-10">
                <div class="shrink-0 right-4">
                    <img class="size-10 rounded-full" src="/images/ed_on_superbus.jpg" alt="Avatar">
                </div>
                <div class="ms-4">
                    <div class="text-base font-semibold text-gray-800 dark:text-neutral-400">Ed Jones</div>
                </div>
            </div>

            <div class="paypal-button-container">
                <form action="https://www.paypal.com/donate" method="post" target="_blank">
                    <input type="hidden" name="hosted_button_id" value="55QUG7FD4HTN4" />
                    <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0"
                        name="submit" title="PayPal - The safer, easier way to pay online!"
                        alt="Donate with PayPal button" />
                </form>
            </div>
        </section>
        <div class="text-xs text-gray-500 mt-8">
            <a href="https://www.flaticon.com/free-icons/collaboration" title="collaboration icons"
                class="text-gray-500">Collaboration icons created by small.smiles - Flaticon</a>
        </div>
        <OpenSourceModal ref="openSourceModal" />
    </div>
</template>

<script setup>
import { ref } from 'vue';
import partners from '../assets/partners.png';
import OpenSourceModal from '../components/OpenSourceModal.vue';

const openSourceModal = ref(null);

const showOpenSourceModal = () => {
    openSourceModal.value?.show();
};
</script>

<style scoped>
.about-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    background-color: #222;
}

.about-section {
    margin-bottom: .2rem;
    color: ivory;
    background-color: #222;
    padding: 1rem;
    text-align: left;
}

.about-section h2 {
    color: ivory;
    font-weight: 600;
}

h1 {
    color: ivory;
    margin-bottom: 2rem;
    text-align: center;
    font-size: 1.5rem;
}

h2 {
    color: ivory;
    margin-bottom: 1rem;
}

p {
    line-height: 1.6;
    color: ivory;
    margin-bottom: 1rem;
}

ul {
    list-style-type: disc;
    margin-left: 2rem;
    margin-bottom: 1rem;
}

li {
    line-height: 1.6;
    color: ivory;
    margin-bottom: 0.5rem;
}

a {
    color: #3498db;
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}

.donation-box {
    background-color: #c8cbcd;
    border-radius: 8px;
    padding: 2rem;
    margin-top: 2rem;
    border: 1px solid #212327;
    color: rgb(55, 19, 19);
}

.donation-box h2 {
    color: black;
}

.donation-box p {
    color: black;
}

.paypal-button-container {
    display: flex;
    justify-content: center;
    margin-top: 1.5rem;
    color: black;
}

.paypal-button-container p {
    color: black;
}

.paypal-button-container input[type="image"] {
    max-width: 200px;
    height: auto;
}
</style>