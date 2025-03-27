<template>
    <div v-show="isVisible" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] p-4"
        @click.self="handleClose">
        <div
            class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <button @click="handleClose"
                class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white text-xl transition-colors"
                aria-label="Close">
                ×
            </button>

            <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Culture of Open Source</h3>

            <div class="space-y-6 text-gray-700 dark:text-gray-300">
                <section>
                    <h4 class="text-md font-semibold mb-2">Overview</h4>
                    <p>
                        An open source community is a group of individuals who collaborate to develop software, with
                        contributions made voluntarily based on their interests and needs, rather than being assigned
                        tasks by
                        executives.
                    </p>
                    <p>
                        Open source communities are characterized by collaboration, transparency, and a meritocratic
                        approach
                        where contributions are valued based on their merit, fostering a spirit of innovation and shared
                        learning.
                    </p>
                </section>

                <section>
                    <h4 class="text-md font-semibold mb-2">Key Principles and Values</h4>
                    <ul class="list-disc pl-5 space-y-2">
                        <li><strong>Collaboration and Transparency:</strong> Open source projects are built through the
                            collective efforts of individuals, with source code and development processes being openly
                            accessible.</li>
                        <li><strong>Meritocracy:</strong> Contributions are evaluated based on their quality and impact,
                            rather
                            than factors like title or position.</li>
                        <li><strong>Openness and Inclusivity:</strong> Open source communities generally welcome
                            contributions
                            from anyone, regardless of their background or experience.</li>
                        <li><strong>Respect and Reciprocity:</strong> Open source communities value respectful
                            communication and
                            mutual support among members.</li>
                        <li><strong>Self-Organization:</strong> Open source projects often have a decentralized
                            structure,
                            allowing for flexibility and adaptability.</li>
                        <li><strong>Freedom to Share:</strong> Open source encourages the free distribution and
                            modification of
                            software, fostering innovation and experimentation.</li>
                        <li><strong>Volunteerism:</strong> Many open source projects are driven by volunteers who
                            contribute
                            their time and expertise.</li>
                        <li><strong>Community-Driven Development:</strong> Open source communities are dynamic
                            ecosystems driven
                            by shared goals, mutual support, and evolving motivations.</li>
                        <li><strong>Learning and Innovation:</strong> Open source communities are spaces where people
                            can learn
                            from each other, share knowledge, and contribute to the advancement of technology.</li>
                    </ul>
                </section>

                <section>
                    <h4 class="text-md font-semibold mb-2">How Open Source Communities Work</h4>
                    <ul class="list-disc pl-5 space-y-2">
                        <li><strong>Voluntary Contributions:</strong> Individuals contribute to open source projects
                            based on
                            their interests and expertise, rather than being paid employees.</li>
                        <li><strong>Open Communication:</strong> Open source communities rely on open communication and
                            collaboration to share ideas, discuss issues, and coordinate development efforts.</li>
                        <li><strong>Version Control Systems:</strong> Tools like Git are used to track changes to the
                            source
                            code and facilitate collaboration among developers.</li>
                        <li><strong>Community Forums and Mailing Lists:</strong> Open source communities often use
                            forums,
                            mailing lists, and other online platforms to facilitate communication and discussion among
                            members.</li>
                        <li><strong>Code Reviews:</strong> Open source projects often have a process of code review,
                            where
                            developers review each other's code to ensure quality and identify potential issues.</li>
                    </ul>
                </section>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const isVisible = ref(false);

const handleClose = () => {
    isVisible.value = false;
};

const show = () => {
    isVisible.value = true;
};

defineExpose({
    show
});
</script>

<style scoped>
.fixed {
    z-index: 9999 !important;
}

.fixed {
    transition: opacity 0.2s ease-in-out;
}

.relative {
    z-index: 10000;
}
</style>