<template>
    <div class="about-container">
        <h1>About</h1>

        <section class="about-section">
            <h2>A community-driven, open-source effort.</h2>
            <ul>
                <li class="list-none">Repository: <a
                        href="https://github.com/EdJones/sor-quizzes">https://github.com/EdJones/sor-quizzes</a>
                </li>
            </ul>

            <p>
                This app will only make sense when validated and refined by the community. <!--img
                    src="../src/assets/images/partners.png" alt="Community" class="community-image"-->
            </p>
        </section>

        <section class="about-section">
            <h2>Origins</h2>
            <p>
                The Science of Reading community has a source of truth problem:
            <ul>
                <li>
                    <a href="https://www.aei.org/education/the-science-of-reading-is-on-a-winning-streak-and-thats-a-problem/"
                        target="_blank">The "Science of Reading" Is on a Winning
                        Streak. And That's a Problem.</a> Robert Pondiscio
                </li>
                <li>
                    <a href="https://seidenbergreading.net/2024/06/24/where-does-the-science-of-reading-go-from-here-2/"
                        target="_blank">Where does the Science of Reading go from here?</a> Mark Seidenberg
                </li>
            </ul>

            Today, teachers are hard-pressed to find the most current, evidence-based information about the science
            of reading and structured literacy practices.
            </p>
        </section>

        <section class="about-section">
            <h2>Contributing</h2>
            <p>
                Please consider <router-link to="/QuizSetView" class="">making this better</router-link>.
            </p>

        </section>




        <section class="about-section donation-box">
            <h2>Support Our Mission</h2>
            <p>
                This app is built by Ed Jones, as a gift to the Science of reading community.
            </p>
            <p>
                While mine is the vision behind
                <a href="https://skunkworks-edu.com">Skunkworks\edu</a>,
                I've never
                been paid
                for work in K12.
            </p>
            <p>
                If you are able, help me attend Research Ed events, and pay the expenses of this app.
            </p>

            <div class="paypal-button-container">
                <form action="https://www.paypal.com/donate" method="post" target="_blank">
                    <input type="hidden" name="hosted_button_id" value="55QUG7FD4HTN4" />
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
    background-color: #222;
}

.about-section {
    margin-bottom: 1.5rem;
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
    background-color: #f8fafc;
    border-radius: 8px;
    padding: 2rem;
    margin-top: 3rem;
    border: 1px solid #e2e8f0;
    color: black;
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