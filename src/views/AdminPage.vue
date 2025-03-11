<template>
    <div class="admin-page p-4">
        <h1 class="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Admin Tools</h1>

        <div v-if="!authStore.user || !isAdmin" class="text-red-600">
            Access denied. You must be an admin to view this page.
        </div>

        <div v-else>
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 class="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Database Management</h2>
                <AdminTools />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import AdminTools from '../components/AdminTools.vue';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const router = useRouter();
const authStore = useAuthStore();
const isAdmin = ref(false);

onMounted(async () => {
    if (!authStore.user) {
        router.push('/');
        return;
    }

    // Check if user is admin
    const userDoc = await getDoc(doc(db, 'users', authStore.user.uid));
    if (userDoc.exists()) {
        isAdmin.value = userDoc.data().isAdmin === true;
    }

    if (!isAdmin.value) {
        router.push('/');
    }
});
</script>