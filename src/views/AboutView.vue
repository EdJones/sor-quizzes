<template>
    <div class="about-container">
        <h1>About SOR Quizzes</h1>

        <section class="about-section">
            <h2>A community-driven, open-source effort</h2>
            <p>
                The Science of Reading Quiz is designed to help educators and literacy professionals deepen their
                understanding of evidence-based reading instruction. Our goal is to promote the widespread adoption of
                research-backed teaching practices that help all children learn to read effectively.
            </p>
        </section>

        <section class="about-section">
            <h2>Origins</h2>
            <p>
                SOR Quizzes aims to help solve the source of truth problem for the science of reading.

                Today, teachers are hard-pressed to find the most current, evidence-based information about the science
                of reading and structured literacy practices.
            </p>
        </section>

        <section class="about-section">
            <h2>What is the Science of Reading?</h2>
            <p>
                Conducted across six decades, by research labs around the world, the science of reading is derived from
                thousands of studies in many related fields. The research has revealed how the brain learns to read and
                the most effective methods for teaching reading.
            </p>
        </section>

        <section class="about-section">
            <h2>How to Use This Quiz</h2>
            <p>
                This quiz is designed to:
            </p>
            <ul>
                <li>Test your knowledge of key concepts in the Science of Reading</li>
                <li>Provide immediate feedback and explanations for each question</li>
                <li>Include references to research and additional resources</li>
                <li>Help identify areas where you might want to deepen your understanding</li>
            </ul>
        </section>

        <section class="about-section">
            <h2>Contributing</h2>
            <p>
                We welcome contributions from educators, researchers, and literacy experts. If you'd like to:
            </p>
            <ul>
                <li>Submit new questions</li>
                <li>Improve existing questions</li>
                <li>Add research citations</li>
                <li>Suggest improvements to the platform</li>
            </ul>
            <p>
                Please contact us at [contact information].
            </p>
        </section>

        <section class="about-section">
            <h2>Resources</h2>
            <p>
                For more information about the Science of Reading, we recommend:
            </p>
            <ul>
                <li><a href="https://www.thereadingleague.org/" target="_blank">The Reading League</a></li>
                <li><a href="https://www.nctq.org/" target="_blank">National Council on Teacher Quality</a></li>
                <li><a href="https://www.whatisthescienceofreading.org/" target="_blank">What is the Science of
                        Reading?</a></li>
            </ul>
        </section>

        <section class="about-section donation-box">
            <h2>Support Our Mission</h2>
            <p>
                Help us continue developing and improving these quizzes by making a donation. Your support helps us:
            </p>
            <ul>
                <li>Add more quiz questions and content</li>
                <li>Improve the platform's features</li>
                <li>Maintain and update existing content</li>
                <li>Support our community-driven development</li>
            </ul>
            <div class="paypal-button-container">
                <form action="https://www.paypal.com/donate" method="post" target="_blank">
                    <input type="hidden" name="hosted_button_id" value="YOUR_PAYPAL_BUTTON_ID" />
                    <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0"
                        name="submit" title="PayPal - The safer, easier way to pay online!"
                        alt="Donate with PayPal button" />
                </form>
            </div>
        </section>
    </div>
</template>

<script>
export default {
    name: 'AboutView'
}
</script>

<style scoped>
.about-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
}

.about-section {
    margin-bottom: 2rem;
}

h1 {
    color: #2c3e50;
    margin-bottom: 2rem;
    text-align: center;
}

h2 {
    color: #2c3e50;
    margin-bottom: 1rem;
}

p {
    line-height: 1.6;
    color: #34495e;
    margin-bottom: 1rem;
}

ul {
    list-style-type: disc;
    margin-left: 2rem;
    margin-bottom: 1rem;
}

li {
    line-height: 1.6;
    color: #34495e;
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
    background-color: #f8fafc;
    border-radius: 8px;
    padding: 2rem;
    margin-top: 3rem;
    border: 1px solid #e2e8f0;
}

.paypal-button-container {
    display: flex;
    justify-content: center;
    margin-top: 1.5rem;
}

.paypal-button-container input[type="image"] {
    max-width: 200px;
    height: auto;
}
</style>