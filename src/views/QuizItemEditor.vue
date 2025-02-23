<template>
  <div class="new-item-form">
    <div v-if="submitStatus.show" :class="['status-message', submitStatus.type]">
      <div class="button-group mb-4">
        <button @click="resetForm" class="preview-toggle">
          Add Another Quiz Item
        </button>
        <button @click="returnToQuizzes" class="preview-toggle">
          Return to Quizzes
        </button>
      </div>

      {{ submitStatus.message }}

      <div v-if="submitStatus.type === 'success' && submittedEntry" class="submitted-preview mt-4">
        <h3>Your submitted quiz item:</h3>
        <QuizItem :currentQuizItem="submittedEntry" :itemNum="0" :reviewMode="true" :basicMode="false"
          :userAnswer="submittedEntry.correctAnswer" />
      </div>
    </div>

    <div class="flex items-center gap-4">
      <span class="preview-controls-text">{{ store.draftQuizEntry.originalId ? `Editing Quiz Item
        #${store.draftQuizEntry.originalId}` : 'Create New Quiz Item' }}</span>
      <div class="preview-controls">
        <div class="button-group">
          <div class="flex flex-col gap-1">
            <button type="button" @click="returnToQuizzes"
              :class="['return-button smaller-button', { active: returnButton.active }]">
              Return to Quizzes
            </button>
            <button type="button" @click="$router.push('/quizSetView')"
              class="return-button smaller-button bg-indigo-600 hover:bg-indigo-700 text-white">
              View Quiz Sets
            </button>
          </div>
          <button type="button" @click="togglePreviewMode" :class="['preview-toggle', { active: previewMode }]">
            {{ previewMode ? 'Edit Mode' : 'Preview Mode' }}
          </button>
          <button type="button" @click="jsonPreviewMode = !jsonPreviewMode"
            :class="['preview-toggle', { active: jsonPreviewMode }]">
            {{ jsonPreviewMode ? 'Hide JSON' : 'Show JSON' }}
          </button>
          <button @click="$router.push('/issues')" class="github-button">
            View/Add Issues
          </button>
        </div>
      </div>
    </div>

    <div v-if="!auth.user" class="alert alert-info mb-4">
      <p><span class="text-yellow-500">You are currently using the quiz builder anonymously.</span> Your quiz
        entry
        will be saved as a draft.</p>
      <p>To submit your quiz for review, please <router-link to="/login" class="text-blue-600 hover:text-blue-800">sign
          in</router-link>.</p>
    </div>

    <div v-if="auth.user && auth.user.isAnonymous" class="alert alert-info mb-4">
      <p>You are currently using the quiz builder anonymously. Your quiz entry will be saved as a draft.</p>
      <p>To submit your quiz for review, please <router-link to="/login" class="text-blue-600 hover:text-blue-800">sign
          in</router-link> with an email account.</p>
    </div>

    <div v-if="jsonPreviewMode" class="json-preview">
      <div class="json-header">
        <h3>JSON Preview</h3>
        <button @click="copyToClipboard" class="copy-button">
          <span v-if="!copySuccess">Copy JSON</span>
          <span v-else>Copied!</span>
        </button>
      </div>
      <VueJsonPretty :data="newEntry" :deep="2" :showLength="true" :showDoubleQuotes="true" :showLine="true"
        :selectableType="'single'" />
    </div>

    <div v-if="previewMode" class="preview-section">
      <QuizItem :currentQuizItem="newEntry" :itemNum="0" :reviewMode="true" :basicMode="false" :previewMode="true"
        :userAnswer="newEntry.correctAnswer" />
    </div>

    <div v-else>
      <QuizItem :currentQuizItem="newEntry" :itemNum="0" :reviewMode="true" :basicMode="false" :previewMode="true"
        :userAnswer="newEntry.correctAnswer" />
    </div>

    <form v-if="!previewMode" @submit.prevent="submitForm">
      <!-- Template selector -->
      <div class="template-selector">
        <div class="form1-section bg-indigo-950/10 dark:bg-indigo-950/30">
          <div class="form-group1">
            <QuizSelector v-if="showSelector" />
          </div>
        </div>
      </div>

      <!-- Question Group -->
      <div class="form-group-section question-section">
        <div class="question-content-wrapper">
          <!-- Basic Information -->
          <details>
            <summary class="section-summary">
              <span class="summary-text">Pose a Question</span>
              <span class="arrow-indicator">▼</span>
            </summary>
            <div class="form-section">
              <div class="form-group">
                <label for="title">Title:</label>
                <input type="text" id="title" v-model="newEntry.title"
                  :class="['form-input', { 'invalid-field': invalidFields.has('title') }]"
                  :data-error="getFieldError('title')" :placeholder="newEntry.title"
                  @focus="handleFocus($event, 'title')" @blur="handleBlur($event, 'title')" />
              </div>
              <div class="form-group">
                <label for="subtitle">Subtitle:</label>
                <input type="text" id="subtitle" v-model="newEntry.subtitle"
                  :class="['form-input', { 'invalid-field': invalidFields.has('subtitle') }]"
                  :data-error="getFieldError('subtitle')" :placeholder="newEntry.subtitle"
                  @focus="handleFocus($event, 'subtitle')" @blur="handleBlur($event, 'subtitle')" />
              </div>
              <div class="form-group">
                <label for="question">Question:</label>
                <textarea id="question" v-model="newEntry.Question"
                  :class="['form-textarea', { 'invalid-field': invalidFields.has('Question') }]"
                  :data-error="getFieldError('Question')" :placeholder="newEntry.Question"
                  @focus="handleFocus($event, 'Question')" @blur="handleBlur($event, 'Question')"></textarea>
              </div>
              <div class="form-group">
                <label for="questionP2">Question Line 2 (optional):</label>
                <textarea id="questionP2" v-model="newEntry.questionP2"
                  :class="['form-textarea', { 'invalid-field': invalidFields.has('questionP2') }]"
                  :data-error="getFieldError('questionP2')" :placeholder="newEntry.questionP2"
                  @focus="handleFocus($event, 'questionP2')" @blur="handleBlur($event, 'questionP2')"></textarea>
              </div>
            </div>
          </details>

          <!-- Multiple Choice Options -->
          <details>
            <summary class="section-summary">
              <span class="summary-text">Add/Edit Answer Options</span>
              <span class="arrow-indicator">▼</span>
            </summary>
            <div class="form-section">
              <div class="form-group">
                <label for="option1">Option 1:</label>
                <input type="text" id="option1" v-model="newEntry.option1"
                  :class="['form-input', { 'invalid-field': invalidFields.has('option1') }]"
                  :data-error="getFieldError('option1')" :placeholder="newEntry.option1"
                  @focus="handleFocus($event, 'option1')" @blur="handleBlur($event, 'option1')" />
              </div>
              <div class="form-group">
                <label for="option2">Option 2:</label>
                <input type="text" id="option2" v-model="newEntry.option2"
                  :class="['form-input', { 'invalid-field': invalidFields.has('option2') }]"
                  :data-error="getFieldError('option2')" :placeholder="newEntry.option2"
                  @focus="handleFocus($event, 'option2')" @blur="handleBlur($event, 'option2')" />
              </div>
              <div class="form-group">
                <label for="option3">Option 3:</label>
                <input type="text" id="option3" v-model="newEntry.option3"
                  :class="['form-input', { 'invalid-field': invalidFields.has('option3') }]"
                  :data-error="getFieldError('option3')" :placeholder="newEntry.option3"
                  @focus="handleFocus($event, 'option3')" @blur="handleBlur($event, 'option3')" />
              </div>
              <div class="form-group">
                <label for="option4">Option 4:</label>
                <input type="text" id="option4" v-model="newEntry.option4"
                  :class="['form-input', { 'invalid-field': invalidFields.has('option4') }]"
                  :data-error="getFieldError('option4')" :placeholder="newEntry.option4"
                  @focus="handleFocus($event, 'option4')" @blur="handleBlur($event, 'option4')" />
              </div>
              <div class="form-group">
                <label for="option5">Option 5:</label>
                <input type="text" id="option5" v-model="newEntry.option5"
                  :class="['form-input', { 'invalid-field': invalidFields.has('option5') }]"
                  :data-error="getFieldError('option5')" :placeholder="newEntry.option5"
                  @focus="handleFocus($event, 'option5')" @blur="handleBlur($event, 'option5')" />
              </div>
              <div class="form-group">
                <label for="correctAnswer">Correct Answer (1-5):</label>
                <input type="number" id="correctAnswer" v-model="newEntry.correctAnswer"
                  :class="['form-input', { 'invalid-field': invalidFields.has('correctAnswer') }]"
                  :data-error="getFieldError('correctAnswer')" min="1" max="5" required
                  :placeholder="newEntry.correctAnswer" @focus="handleFocus($event, 'correctAnswer')"
                  @blur="handleBlur($event, 'correctAnswer')" />
              </div>
            </div>
          </details>

          <!-- Explanation toggle -->
          <div class="section-summary" @click="showExplanationSection = !showExplanationSection">
            <span class="summary-text">
              Add/Edit Explanation Section
              <span v-if="hasExplanationSectionErrors" class="section-error-indicator"
                title="This section contains validation errors">⚠️</span>
            </span>
            <span class="arrow-indicator" :class="{ 'rotated': !showExplanationSection }">▼</span>
          </div>
        </div>
      </div>

      <!-- Wrap explanation section in v-show -->
      <div v-show="showExplanationSection" class="form-group-section explanation-section">
        <div class="explanation-toggles">
          <button type="button" @click="activeSection = activeSection === 'explanations' ? '' : 'explanations'"
            :class="['section-button', { active: activeSection === 'explanations' }]">
            Explanations
          </button>
          <button type="button" @click="activeSection = activeSection === 'media' ? '' : 'media'"
            :class="['section-button', { active: activeSection === 'media' }]">
            Media
          </button>
          <button type="button" @click="activeSection = activeSection === 'podcasts' ? '' : 'podcasts'"
            :class="['section-button', { active: activeSection === 'podcasts' }]">
            Podcasts
          </button>
          <button type="button" @click="handleCitationsClick"
            :class="['section-button', { active: activeSection === 'citations' }]">
            Citations
          </button>
          <button type="button" @click="handleResourcesClick"
            :class="['section-button', { active: activeSection === 'resources' }]">
            Resources
          </button>
          <button type="button" @click="activeSection = activeSection === 'cautions' ? '' : 'cautions'"
            :class="['section-button', { active: activeSection === 'cautions' }]">
            Cautions
          </button>
          <button type="button" @click="activeSection = activeSection === 'closing' ? '' : 'closing'"
            :class="['section-button', { active: activeSection === 'closing' }]">
            Closing
          </button>
        </div>

        <div class="explanation-content-wrapper">
          <!-- Explanations -->
          <div v-show="activeSection === 'explanations'" class="form-section">
            <div class="form-group">
              <label for="explanation">Primary Explanation:</label>
              <textarea id="explanation" v-model="newEntry.explanation"
                :class="['form-textarea', { 'invalid-field': invalidFields.has('explanation') }]"
                :data-error="getFieldError('explanation')" :placeholder="newEntry.explanation"
                @focus="handleFocus($event, 'explanation')" @blur="handleBlur($event, 'explanation')"></textarea>
            </div>
            <div class="form-group">
              <label for="explanation2">Secondary Explanation:</label>
              <textarea id="explanation2" v-model="newEntry.explanation2"
                :class="['form-textarea', { 'invalid-field': invalidFields.has('explanation2') }]"
                :data-error="getFieldError('explanation2')" :placeholder="newEntry.explanation2"
                @focus="handleFocus($event, 'explanation2')" @blur="handleBlur($event, 'explanation2')"></textarea>
            </div>
          </div>

          <!-- Media -->
          <div v-show="activeSection === 'media'" class="form-section">
            <div class="form-group">
              <label for="videoId">YouTube Video ID:</label>
              <input type="text" id="videoId" v-model="newEntry.videoId"
                :class="['form-input', { 'invalid-field': invalidFields.has('videoId') }]"
                :data-error="getFieldError('videoId')" :placeholder="newEntry.videoId"
                @focus="handleFocus($event, 'videoId')" @blur="handleBlur($event, 'videoId')" />
            </div>
            <div class="form-group">
              <label for="imageUrl">Image URL:</label>
              <input type="text" id="imageUrl" v-model="newEntry.imageUrl"
                :class="['form-input', { 'invalid-field': invalidFields.has('imageUrl') }]"
                :data-error="getFieldError('imageUrl')" :placeholder="newEntry.imageUrl"
                @focus="handleFocus($event, 'imageUrl')" @blur="handleBlur($event, 'imageUrl')" />
            </div>
            <div class="form-group">
              <label for="imageAltText">Image Alt Text:</label>
              <input type="text" id="imageAltText" v-model="newEntry.imageAltText"
                :class="['form-input', { 'invalid-field': invalidFields.has('imageAltText') }]"
                :data-error="getFieldError('imageAltText')" :placeholder="newEntry.imageAltText"
                @focus="handleFocus($event, 'imageAltText')" @blur="handleBlur($event, 'imageAltText')" />
            </div>
          </div>

          <!-- Podcast Episodes -->
          <div v-show="activeSection === 'podcasts'" class="form-section">
            <div class="form-group">
              <label for="podcastEpisode1-title">Episode 1 Title:</label>
              <input type="text" id="podcastEpisode1-title" v-model="newEntry.podcastEpisode.title"
                :class="['form-input', { 'invalid-field': invalidFields.has('podcastEpisode.title') }]"
                :data-error="getFieldError('podcastEpisode.title')" :placeholder="newEntry.podcastEpisode.title"
                @focus="handleFocus($event, 'podcastEpisode.title')"
                @blur="handleBlur($event, 'podcastEpisode.title')" />
            </div>
            <div class="form-group">
              <label for="podcastEpisode1-url">Episode 1 URL:</label>
              <input type="text" id="podcastEpisode1-url" v-model="newEntry.podcastEpisode.EpisodeUrl"
                :class="['form-input', { 'invalid-field': invalidFields.has('podcastEpisode.EpisodeUrl') }]"
                :data-error="getFieldError('podcastEpisode.EpisodeUrl')"
                :placeholder="newEntry.podcastEpisode.EpisodeUrl"
                @focus="handleFocus($event, 'podcastEpisode.EpisodeUrl')"
                @blur="handleBlur($event, 'podcastEpisode.EpisodeUrl')" />
            </div>
            <div class="form-group">
              <label for="podcastEpisode1-audio">Episode 1 Audio URL:</label>
              <input type="text" id="podcastEpisode1-audio" v-model="newEntry.podcastEpisode.audioUrl"
                :class="['form-input', { 'invalid-field': invalidFields.has('podcastEpisode.audioUrl') }]"
                :data-error="getFieldError('podcastEpisode.audioUrl')" :placeholder="newEntry.podcastEpisode.audioUrl"
                @focus="handleFocus($event, 'podcastEpisode.audioUrl')"
                @blur="handleBlur($event, 'podcastEpisode.audioUrl')" />
            </div>
            <div class="form-group">
              <label for="podcastEpisode1-desc">Episode 1 Description:</label>
              <textarea id="podcastEpisode1-desc" v-model="newEntry.podcastEpisode.description"
                :class="['form-textarea', { 'invalid-field': invalidFields.has('podcastEpisode.description') }]"
                :data-error="getFieldError('podcastEpisode.description')"
                :placeholder="newEntry.podcastEpisode.description"
                @focus="handleFocus($event, 'podcastEpisode.description')"
                @blur="handleBlur($event, 'podcastEpisode.description')"></textarea>
            </div>
            <div class="form-group">
              <label for="podcastEpisode1-time">Episode 1 Start Time (seconds):</label>
              <input type="number" id="podcastEpisode1-time" v-model="newEntry.podcastEpisode.podcastStartTime"
                :class="['form-input', { 'invalid-field': invalidFields.has('podcastEpisode.podcastStartTime') }]"
                :data-error="getFieldError('podcastEpisode.podcastStartTime')" min="0"
                :placeholder="newEntry.podcastEpisode.podcastStartTime"
                @focus="handleFocus($event, 'podcastEpisode.podcastStartTime')"
                @blur="handleBlur($event, 'podcastEpisode.podcastStartTime')" />
            </div>

            <hr class="section-divider">

            <div class="form-group">
              <label for="podcastEpisode2-title">Episode 2 Title:</label>
              <input type="text" id="podcastEpisode2-title" v-model="newEntry.podcastEpisode2.title"
                :class="['form-input', { 'invalid-field': invalidFields.has('podcastEpisode2.title') }]"
                :data-error="getFieldError('podcastEpisode2.title')" :placeholder="newEntry.podcastEpisode2.title"
                @focus="handleFocus($event, 'podcastEpisode2.title')"
                @blur="handleBlur($event, 'podcastEpisode2.title')" />
            </div>
            <div class="form-group">
              <label for="podcastEpisode2-url">Episode 2 URL:</label>
              <input type="text" id="podcastEpisode2-url" v-model="newEntry.podcastEpisode2.EpisodeUrl"
                :class="['form-input', { 'invalid-field': invalidFields.has('podcastEpisode2.EpisodeUrl') }]"
                :data-error="getFieldError('podcastEpisode2.EpisodeUrl')"
                :placeholder="newEntry.podcastEpisode2.EpisodeUrl"
                @focus="handleFocus($event, 'podcastEpisode2.EpisodeUrl')"
                @blur="handleBlur($event, 'podcastEpisode2.EpisodeUrl')" />
            </div>
            <div class="form-group">
              <label for="podcastEpisode2-audio">Episode 2 Audio URL:</label>
              <input type="text" id="podcastEpisode2-audio" v-model="newEntry.podcastEpisode2.audioUrl"
                :class="['form-input', { 'invalid-field': invalidFields.has('podcastEpisode2.audioUrl') }]"
                :data-error="getFieldError('podcastEpisode2.audioUrl')" :placeholder="newEntry.podcastEpisode2.audioUrl"
                @focus="handleFocus($event, 'podcastEpisode2.audioUrl')"
                @blur="handleBlur($event, 'podcastEpisode2.audioUrl')" />
            </div>
            <div class="form-group">
              <label for="podcastEpisode2-desc">Episode 2 Description:</label>
              <textarea id="podcastEpisode2-desc" v-model="newEntry.podcastEpisode2.description"
                :class="['form-textarea', { 'invalid-field': invalidFields.has('podcastEpisode2.description') }]"
                :data-error="getFieldError('podcastEpisode2.description')"
                :placeholder="newEntry.podcastEpisode2.description"
                @focus="handleFocus($event, 'podcastEpisode2.description')"
                @blur="handleBlur($event, 'podcastEpisode2.description')"></textarea>
            </div>
            <div class="form-group">
              <label for="podcastEpisode2-time">Episode 2 Start Time (seconds):</label>
              <input type="number" id="podcastEpisode2-time" v-model="newEntry.podcastEpisode2.podcastStartTime"
                :class="['form-input', { 'invalid-field': invalidFields.has('podcastEpisode2.podcastStartTime') }]"
                :data-error="getFieldError('podcastEpisode2.podcastStartTime')" min="0"
                :placeholder="newEntry.podcastEpisode2.podcastStartTime"
                @focus="handleFocus($event, 'podcastEpisode2.podcastStartTime')"
                @blur="handleBlur($event, 'podcastEpisode2.podcastStartTime')" />
            </div>
          </div>

          <!-- Citations -->
          <div v-show="activeSection === 'citations'" class="form-section">
            <div v-for="(citation, index) in newEntry.citations" :key="index" class="citation-group">
              <h3>Citation {{ index + 1 }}</h3>
              <div class="form-group">
                <label :for="`citation-${index}-title`">Title:</label>
                <input type="text" :id="`citation-${index}-title`" v-model="citation.title"
                  :class="['form-input', { 'invalid-field': invalidFields.has(`citation-${index}-title`) }]"
                  :data-error="getFieldError(`citation-${index}-title`)" :placeholder="citation.title"
                  @focus="handleFocus($event, `citation-${index}-title`)"
                  @blur="handleBlur($event, `citation-${index}-title`)" />
              </div>
              <div class="form-group">
                <label :for="`citation-${index}-author`">Author:</label>
                <input type="text" :id="`citation-${index}-author`" v-model="citation.author"
                  :class="['form-input', { 'invalid-field': invalidFields.has(`citation-${index}-author`) }]"
                  :data-error="getFieldError(`citation-${index}-author`)" :placeholder="citation.author"
                  @focus="handleFocus($event, `citation-${index}-author`)"
                  @blur="handleBlur($event, `citation-${index}-author`)" />
              </div>
              <div class="form-group">
                <label :for="`citation-${index}-url`">URL:</label>
                <input type="text" :id="`citation-${index}-url`" v-model="citation.url"
                  :class="['form-input', { 'invalid-field': invalidFields.has(`citation-${index}-url`) }]"
                  :data-error="getFieldError(`citation-${index}-url`)" :placeholder="citation.url"
                  @focus="handleFocus($event, `citation-${index}-url`)"
                  @blur="handleBlur($event, `citation-${index}-url`)" />
              </div>
              <div class="form-group">
                <label :for="`citation-${index}-year`">Year:</label>
                <input type="text" :id="`citation-${index}-year`" v-model="citation.year"
                  :class="['form-input', { 'invalid-field': invalidFields.has(`citation-${index}-year`) }]"
                  :data-error="getFieldError(`citation-${index}-year`)" :placeholder="citation.year"
                  @focus="handleFocus($event, `citation-${index}-year`)"
                  @blur="handleBlur($event, `citation-${index}-year`)" />
              </div>
              <div class="form-group">
                <label :for="`citation-${index}-image`">Image URL:</label>
                <input type="text" :id="`citation-${index}-image`" v-model="citation.imageUrl"
                  :class="['form-input', { 'invalid-field': invalidFields.has(`citation-${index}-image`) }]"
                  :data-error="getFieldError(`citation-${index}-image`)" :placeholder="citation.imageUrl"
                  @focus="handleFocus($event, `citation-${index}-image`)"
                  @blur="handleBlur($event, `citation-${index}-image`)" />
              </div>
            </div>
            <button type="button" @click="addCitation" class="add-button">Add Another Citation</button>
          </div>

          <!-- Resources -->
          <div v-show="activeSection === 'resources'" class="form-section">
            <div v-for="(resource, index) in newEntry.resources" :key="index" class="resource-group">
              <h3>Resource {{ index + 1 }}</h3>
              <div class="form-group">
                <label :for="`resource-${index}-title`">Title:</label>
                <input type="text" :id="`resource-${index}-title`" v-model="resource.title"
                  :class="['form-input', { 'invalid-field': invalidFields.has(`resource-${index}-title`) }]"
                  :data-error="getFieldError(`resource-${index}-title`)" :placeholder="resource.title"
                  @focus="handleFocus($event, `resource-${index}-title`)"
                  @blur="handleBlur($event, `resource-${index}-title`)" />
              </div>
              <div class="form-group">
                <label :for="`resource-${index}-author`">Author:</label>
                <input type="text" :id="`resource-${index}-author`" v-model="resource.author"
                  :class="['form-input', { 'invalid-field': invalidFields.has(`resource-${index}-author`) }]"
                  :data-error="getFieldError(`resource-${index}-author`)" :placeholder="resource.author"
                  @focus="handleFocus($event, `resource-${index}-author`)"
                  @blur="handleBlur($event, `resource-${index}-author`)" />
              </div>
              <div class="form-group">
                <label :for="`resource-${index}-url`">URL:</label>
                <input type="text" :id="`resource-${index}-url`" v-model="resource.url"
                  :class="['form-input', { 'invalid-field': invalidFields.has(`resource-${index}-url`) }]"
                  :data-error="getFieldError(`resource-${index}-url`)" :placeholder="resource.url"
                  @focus="handleFocus($event, `resource-${index}-url`)"
                  @blur="handleBlur($event, `resource-${index}-url`)" />
              </div>
              <div class="form-group">
                <label :for="`resource-${index}-description`">Description:</label>
                <textarea :id="`resource-${index}-description`" v-model="resource.description"
                  :class="['form-textarea', { 'invalid-field': invalidFields.has(`resource-${index}-description`) }]"
                  :data-error="getFieldError(`resource-${index}-description`)" :placeholder="resource.description"
                  @focus="handleFocus($event, `resource-${index}-description`)"
                  @blur="handleBlur($event, `resource-${index}-description`)"></textarea>
              </div>
            </div>
            <button type="button" @click="addResource" class="add-button">Add Another Resource</button>
          </div>

          <!-- Cautions -->
          <div v-show="activeSection === 'cautions'" class="form-section">
            <div class="form-group">
              <label for="cautionLevel">Caution Level:</label>
              <input type="text" id="cautionLevel" v-model="newEntry.cautionLevel"
                :class="['form-input', { 'invalid-field': invalidFields.has('cautionLevel') }]"
                :data-error="getFieldError('cautionLevel')" :placeholder="newEntry.cautionLevel"
                @focus="handleFocus($event, 'cautionLevel')" @blur="handleBlur($event, 'cautionLevel')" />
            </div>
            <div class="form-group">
              <label for="caution">Caution Text:</label>
              <textarea id="caution" v-model="newEntry.caution"
                :class="['form-textarea', { 'invalid-field': invalidFields.has('caution') }]"
                :data-error="getFieldError('caution')" :placeholder="newEntry.caution"
                @focus="handleFocus($event, 'caution')" @blur="handleBlur($event, 'caution')"></textarea>
            </div>
          </div>

          <!-- Closing -->
          <div v-show="activeSection === 'closing'" class="form-section">
            <div class="form-group">
              <label for="closingText">Closing Text:</label>
              <textarea id="closingText" v-model="newEntry.closingText"
                :class="['form-textarea', { 'invalid-field': invalidFields.has('closingText') }]"
                :data-error="getFieldError('closingText')" :placeholder="newEntry.closingText"
                @focus="handleFocus($event, 'closingText')" @blur="handleBlur($event, 'closingText')"></textarea>
            </div>
            <div class="form-group">
              <label for="closingText2">Additional Closing Text:</label>
              <textarea id="closingText2" v-model="newEntry.closingText2"
                :class="['form-textarea', { 'invalid-field': invalidFields.has('closingText2') }]"
                :data-error="getFieldError('closingText2')" :placeholder="newEntry.closingText2"
                @focus="handleFocus($event, 'closingText2')" @blur="handleBlur($event, 'closingText2')"></textarea>
            </div>
            <div class="form-group">
              <label for="modal">Modal Content:</label>
              <textarea id="modal" v-model="newEntry.modal"
                :class="['form-textarea', { 'invalid-field': invalidFields.has('modal') }]"
                :data-error="getFieldError('modal')" :placeholder="newEntry.modal" @focus="handleFocus($event, 'modal')"
                @blur="handleBlur($event, 'modal')"></textarea>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 flex justify-between items-center">
        <button @click="saveDraft"
          class="px-6 py-2 bg-black hover:bg-gray-900 text-[#02b87d] rounded-lg flex items-center transition-colors border-2 border-[#02b87d]">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v16a2 2 0 002 2h12a2 2 0 002-2V8.342a2 2 0 00-.602-1.43l-4.44-4.342A2 2 0 0013.56 2H6a2 2 0 00-2 2z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6" />
          </svg>
          Save Draft
        </button>
        <button type="submit" :class="[
          'submit-btn',
          {
            'submit-btn-disabled': !canSubmit,
            'submit-btn-ready': canSubmit
          }
        ]" :disabled="!canSubmit" :title="submitButtonTitle">
          Submit for Review
        </button>
      </div>
    </form>

    <!-- Save status indicator -->
    <div v-if="saveStatus.show" :class="['save-status-indicator', saveStatus.type]" role="status" aria-live="polite">
      {{ saveStatus.message }}
    </div>

    <ProgressSteps :currentStep="currentStep" />
  </div>
</template>

<script>
import { quizStore } from '../stores/quizStore';
import { useAuthStore } from '../stores/authStore';
import QuizItem from '../components/QuizItem.vue';
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'
import { quizEntries } from '../data/quiz-items';
import { ref, watch, onMounted, computed } from 'vue';
import ProgressSteps from '../components/ProgressSteps.vue';
import { useRoute, useRouter } from 'vue-router';
import QuizSelector from '../components/QuizSelector.vue';

export default {
  components: {
    QuizItem,
    VueJsonPretty,
    ProgressSteps,
    QuizSelector
  },
  setup() {
    const store = quizStore();
    const auth = useAuthStore();
    const route = useRoute();
    const router = useRouter();

    onMounted(async () => {
      await store.fetchDraftQuizItems();

      // Get the ID from the route
      const itemId = route.params.id;

      if (itemId) {
        // First check if it's a draft item
        const draftItem = store.draftQuizItems
          .find(item => item.id === itemId);

        if (draftItem) {
          // Load draft item
          store.updateDraftQuizEntry(draftItem);
        } else {
          // Check if it's a permanent quiz item
          const permanentItem = quizEntries.find(item => item.id.toString() === itemId);
          if (permanentItem) {
            // Create a copy of the permanent item for editing
            const copyItem = { ...permanentItem };
            copyItem.originalId = copyItem.id;  // Save the original ID
            copyItem.id = null;  // Reset ID for new draft
            store.updateDraftQuizEntry(copyItem);
          } else {
            // Item not found, redirect to home
            router.push('/');
          }
        }
      }
    });

    return { store, auth };
  },
  computed: {
    newEntry: {
      get() {
        return this.store.draftQuizEntry;
      },
      set(value) {
        this.store.updateDraftQuizEntry(value);
      }
    },
    formattedJson() {
      return JSON.stringify(this.newEntry, null, 2);
    },
    isLoadingDrafts() {
      return this.store.draftQuizItemsLoading;
    },
    draftLoadError() {
      return this.store.draftQuizItemsError;
    },
    canSubmit() {
      return this.store.draftQuizEntry.id && this.validationState.isValid;
    },
    submitButtonTitle() {
      if (!this.store.draftQuizEntry.id) {
        return 'Please save your draft first';
      }
      if (!this.validationState.isValid) {
        return 'Please fix validation errors: ' + this.validationState.errors.join(', ');
      }
      return 'Submit quiz entry for review';
    },
    invalidFields() {
      return this.validationState.invalidFields;
    },
    hasExplanationSectionErrors() {
      const explanationFields = [
        'explanation',
        'explanation2',
        'videoId',
        'imageUrl',
        'imageAltText',
        'podcastEpisode.title',
        'podcastEpisode.EpisodeUrl',
        'podcastEpisode.audioUrl',
        'podcastEpisode.description',
        'podcastEpisode.podcastStartTime',
        'podcastEpisode2.title',
        'podcastEpisode2.EpisodeUrl',
        'podcastEpisode2.audioUrl',
        'podcastEpisode2.description',
        'podcastEpisode2.podcastStartTime'
      ];

      return explanationFields.some(field => this.validationState.invalidFields.has(field));
    },
    currentStep() {
      // Implement logic to determine the current step based on the form's state
      // This is a placeholder and should be replaced with actual implementation
      return 1; // Placeholder, actual implementation needed
    }
  },
  data() {
    return {
      showSelector: true,
      previewMode: false,
      jsonPreviewMode: false,
      showExplanationSection: false,
      returnButton: {
        active: false
      },
      submitStatus: {
        show: false,
        type: '',
        message: ''
      },
      submittedEntry: null,
      activeSection: '',
      copySuccess: false,
      autoSaveTimeout: null,
      lastSaved: null,
      saveStatus: {
        show: false,
        message: '',
        type: ''
      },
      validationState: {
        isValid: false,
        errors: [],
        invalidFields: new Set()
      },
      defaultValues: {
        title: 'Enter title here',
        subtitle: 'Enter subtitle here',
        Question: 'Enter your question here',
        questionP2: 'Enter additional question text here (optional)',
        option1: 'Enter option 1',
        option2: 'Enter option 2',
        option3: 'Enter option 3',
        option4: 'Enter option 4',
        option5: 'Enter option 5',
        explanation: 'Enter explanation here',
        explanation2: 'Enter additional explanation here',
        closingText: 'Enter closing text here',
        closingText2: 'Enter additional closing text here',
        modal: 'Enter modal content here',
        'podcastEpisode.title': 'Enter podcast title',
        'podcastEpisode2.title': 'Enter second podcast title',
        caution: 'Enter caution text here'
      }
    }
  },
  methods: {
    addCitation() {
      this.store.draftQuizEntry.citations.push({
        title: '',
        author: '',
        url: '',
        year: '',
        imageUrl: '',
      });
    },
    removeCitation(index) {
      this.store.draftQuizEntry.citations.splice(index, 1);
    },
    addResource() {
      this.store.draftQuizEntry.resources.push({
        title: '',
        author: '',
        url: '',
        description: '',
      });
    },
    removeResource(index) {
      this.store.draftQuizEntry.resources.splice(index, 1);
    },
    async submitForm() {
      try {
        // Only submit for review, no saving here
        if (!this.store.draftQuizEntry.id) {
          throw new Error('Please save your draft first before submitting');
        }

        // Submit for review
        await this.store.submitForReview(this.store.draftQuizEntry.id);

        this.submittedEntry = { ...this.newEntry };
        this.submitStatus = {
          show: true,
          type: 'success',
          message: 'Quiz entry submitted successfully!'
        };
      } catch (e) {
        this.submitStatus = {
          show: true,
          type: 'error',
          message: e.message || 'Error submitting quiz entry'
        };
      }
    },
    async saveDraft() {
      try {
        await this.store.recordQuizEdit();
        const draftId = await this.store.saveDraftQuizEntry();

        if (!draftId) {
          throw new Error('Failed to save draft');
        }

        // Run validation check after successful save
        await this.checkValidation();

        this.submitStatus = {
          show: true,
          type: 'success',
          message: 'Draft saved successfully!'
        };
      } catch (e) {
        this.submitStatus = {
          show: true,
          type: 'error',
          message: e.message || 'Error saving draft'
        };
      }
    },
    returnToQuizzes() {
      this.$router.push('/');
    },
    handleCitationsClick() {
      if (this.activeSection === 'citations') {
        this.activeSection = '';
      } else {
        this.activeSection = 'citations';
        if (!this.newEntry.citations || this.newEntry.citations.length === 0) {
          this.addCitation();
        }
      }
    },
    handleResourcesClick() {
      if (this.activeSection === 'resources') {
        this.activeSection = '';
      } else {
        this.activeSection = 'resources';
        if (!this.newEntry.resources || this.newEntry.resources.length === 0) {
          this.addResource();
        }
      }
    },
    handleFocus(event, field) {
      // Get the field value through the nested path if it exists
      const fieldValue = field.split('.').reduce((obj, key) => obj?.[key], this.newEntry);
      const defaultValue = this.getDefaultValue(field);

      // Only clear if the current value matches the default value
      if (defaultValue && fieldValue === defaultValue) {
        // For nested fields (e.g., 'podcastEpisode.title')
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          if (this.newEntry[parent]) {
            this.newEntry[parent][child] = '';
          }
        } else {
          this.newEntry[field] = '';
        }
      }
    },
    handleBlur(event, field) {
      // Get the field value through the nested path if it exists
      const fieldValue = field.split('.').reduce((obj, key) => obj?.[key], this.newEntry);
      const defaultValue = this.getDefaultValue(field);

      // Only restore default if field is empty and there was a default value
      if ((!fieldValue || fieldValue.trim() === '') && defaultValue) {
        // For nested fields
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          if (this.newEntry[parent]) {
            this.newEntry[parent][child] = defaultValue;
          }
        } else {
          this.newEntry[field] = defaultValue;
        }
      }
    },
    getDefaultValue(field) {
      return this.defaultValues[field] || '';
    },
    async copyToClipboard() {
      try {
        const jsonString = JSON.stringify(this.newEntry, null, 2);
        await navigator.clipboard.writeText(jsonString);
        this.copySuccess = true;
        console.log('Copied to clipboard:', jsonString); // Debug log
        setTimeout(() => {
          this.copySuccess = false;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
        this.copySuccess = false;
      }
    },
    async checkValidation() {
      const validation = this.store.validateDraftQuizEntry(this.store.draftQuizEntry);
      this.validationState = {
        isValid: validation.errors.length === 0,
        errors: validation.errors,
        invalidFields: validation.invalidFields
      };
    },
    triggerAutoSave() {
      // Clear any existing timeout
      if (this.autoSaveTimeout) {
        clearTimeout(this.autoSaveTimeout);
      }

      // Set new timeout for 2 seconds after last change
      this.autoSaveTimeout = setTimeout(async () => {
        try {
          await this.store.saveDraftQuizEntry();
          this.lastSaved = new Date();
          this.showSaveStatus('Auto-saved', 'success');
        } catch (error) {
          console.error('Auto-save failed:', error);
          this.showSaveStatus('Auto-save failed', 'error');
        }
      }, 2000);
    },
    showSaveStatus(message, type) {
      this.saveStatus = {
        show: true,
        message,
        type
      };

      // Hide the status after 3 seconds
      setTimeout(() => {
        this.saveStatus.show = false;
      }, 3000);
    },
    togglePreviewMode() {
      this.previewMode = !this.previewMode;
      // Hide JSON when toggling preview mode in either direction
      this.jsonPreviewMode = false;
    },
    getFieldError(fieldName) {
      if (this.validationState.invalidFields.has(fieldName)) {
        // Return specific error message based on field type
        if (fieldName.startsWith('option')) {
          return 'This option needs to be changed from its default value';
        }
        if (fieldName === 'title') {
          return 'Title is required';
        }
        if (fieldName === 'Question') {
          return 'Question is required and must be different from default';
        }
        if (fieldName === 'explanation') {
          return 'Explanation is required and must be different from default';
        }
        if (fieldName === 'correctAnswer') {
          return 'Please select a valid answer number';
        }
        // For URLs
        if (fieldName.includes('Url') || fieldName.includes('url')) {
          return 'Please enter a valid URL';
        }
        return 'This field needs to be filled out properly';
      }
      return '';
    },
    initializeNewEntry() {
      // Get a clean entry from the store
      const entry = this.store.draftQuizEntry;

      // Populate with default values
      Object.entries(this.defaultValues).forEach(([field, value]) => {
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          if (!entry[parent]) entry[parent] = {};
          entry[parent][child] = value;
        } else {
          entry[field] = value;
        }
      });

      // Update the store with the initialized entry
      this.store.updateDraftQuizEntry(entry);
    }
  },
  beforeUnmount() {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
  },
  created() {
    if (!this.store.draftQuizEntry.title) {
      this.initializeNewEntry();
    }
  }
};
// Spurious comment
</script>

<style scoped>
.new-item-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(145deg, #2a2d3e, #1f2235);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.2);
  color: #fff;
}

#template-select {
  background: rgba(34, 32, 125, 0.95);
  border: 1px solid rgba(74, 144, 226, 0.2);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  box-sizing: border-box;
  color: #b1b3be;
  dark: text-gray-200;
}

.section-summary {
  /*  background: linear-gradient(135deg, #4a90e2, #357abd);*/

  background: #1e1f26;
  border-color: #01a6fc;
  border-width: 2px;
  color: #01a6fc;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}

.section-summary:hover {
  background: linear-gradient(135deg, #357abd, #2868a9);
  transform: translateY(-1px);
}

/* Remove default details marker */
details>summary {
  list-style: none;
}

details>summary::-webkit-details-marker {
  display: none;
}

/* Handle the connected appearance when details is open */
details[open] .section-summary {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

details[open] .form-section {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

/* Arrow indicator */
.arrow-indicator {
  transition: transform 0.2s;
}

details[open] .arrow-indicator {
  transform: rotate(180deg);
}

.form1-section {
  background: #3f3f88;
  backdrop-filter: blur(10px);

  padding: 10px;
  transition: all 0.3s ease;
}

.form-section {
  background: #3f3f88;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(74, 144, 226, 0.1);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.form-group {
  position: relative;
  margin-bottom: 20px;
}

.form-group1 {
  position: relative;
  margin-left: -5px;
  margin-right: -5px;
}

.form-group label {
  position: absolute;
  top: -10px;
  left: 12px;
  background: #3f3f88;
  padding: 0 8px;
  font-size: 0.85rem;
  color: #fff;
  border-radius: 4px;
  z-index: 1;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.form-group1 label {
  position: absolute;
  top: -10px;
  left: 12px;
  background: #3f3f88;
  padding: 0 8px;
  font-size: 0.85rem;
  color: #fff;
  border-radius: 4px;
  z-index: 1;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);
}

input[type="text"],
input[type="number"],
textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(74, 144, 226, 0.2);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  box-sizing: border-box;
  color: #333;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

input:focus,
textarea:focus {
  background: white;
  border-color: #4a90e2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
  outline: none;
}

/* Only style buttons that don't have specific classes */
button:not([class]) {
  padding: 5px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:not([class]):hover {
  background-color: #45a049;
}

.citation-group,
.resource-group {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.citation-group:last-child,
.resource-group:last-child {
  border-bottom: none;
  margin-bottom: 10px;
}

.citation-group h3,
.resource-group h3 {
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.add-button,
.remove-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  margin-top: 10px;
}

.add-button {
  background-color: #4a90e2;
  color: white;
}

.remove-button {
  background-color: #dc3545;
  color: white;
  margin-top: 15px;
}

.add-button:hover {
  background-color: #357abd;
}

.remove-button:hover {
  background-color: #c82333;
}

h2 {
  margin-bottom: 15px;
  color: #333;
}

h3 {
  margin-bottom: 15px;
  color: #fff;
}

.save-status {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 25px;
  border-radius: 4px;
  cursor: pointer;
  animation: slideIn 0.3s ease-out;
  z-index: 1000;
}

.success {
  background-color: #4CAF50;
  color: white;
}

.error {
  background-color: #f44336;
  color: white;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

details {
  margin-bottom: 0.5rem;
}

details[open] .section-summary {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom: none;
}

details[open] .form-section {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.section-divider {
  margin: 16px 0;
  border: none;
  border-top: 1px solid #444;
}

.preview-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.preview-button,
.json-button,
.github-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s;
  background: linear-gradient(135deg, #4a90e2, #357abd);
  color: white;
}

.preview-button:hover,
.json-button:hover {
  background: linear-gradient(135deg, #357abd, #2868a9);
  transform: translateY(-1px);
}

.github-button {
  background-color: #2ea043;
  color: white;
}

.github-button:hover {
  background-color: #2c974b;
  transform: translateY(-1px);
}

.preview-controls-text {
  padding-left: .8rem;
  margin-right: 1rem;
  font-size: x-large;
  color: #fff;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.button-group {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.button-group>div {
  margin-right: 1rem;
}

.preview-toggle,
.return-button {
  background: linear-gradient(135deg, #4a90e2, #357abd);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.preview-toggle:hover,
.return-button:hover {
  background: linear-gradient(135deg, #357abd, #2868a9);
  transform: translateY(-1px);
}

.preview-toggle.active,
.return-button.active {
  background-color: #4a90e2;
  color: white;
  border-color: #357abd;
}

.smaller-button {
  max-height: 35px;
  font-size: 12px;
  line-height: 1.1;
  padding: 0.2rem 1rem;
}

.return-button.active {
  background-color: #4CAF50;
}

.preview-toggle.active {
  background-color: #4CAF50;
}

.preview-section {
  background: linear-gradient(145deg, #ffffff, #f0f4ff);
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
  @apply bg-white dark:bg-gray-800;
}

.preview-section :deep(.quiz-item) {
  background: transparent;
  @apply text-gray-900 dark:text-white;
}

@media (prefers-color-scheme: dark) {
  .preview-section {
    background: linear-gradient(145deg, #1a1a1a, #2d2d2d);
  }
}

.form-group-section {
  background: rgba(63, 63, 136, 0.95);
  border: 0px solid rgba(255, 255, 255, 0.1);
}

.form-group-section h2 {
  color: #fff;
  margin-bottom: 0.75rem;
  padding-bottom: 0.25rem;
  border-bottom: 0px solid #444;
}

.question-section {

  /* Green accent for question section */
}

.explanation-section {
  border-left: 4px solid #2196F3;
  /* Blue accent for explanation section */
}

/* Adjust spacing between sections within groups */
.form-group-section details {
  margin-bottom: 0.5rem;
}

.form-group-section details:last-child {
  margin-bottom: 0;
}

/* Make the section summaries slightly indented */
.form-group-section .section-summary {
  margin-left: 0.5rem;
}

.question-content-wrapper,
.explanation-content-wrapper {
  background: linear-gradient(135deg,
      rgba(63, 63, 136, 0.2) 0%,
      rgba(63, 63, 136, 0.1) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  /* border: 1px solid rgba(255, 255, 255, 0.18); */
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  padding: 0.5rem;
  border-radius: 4px;
}

.question-content-wrapper .form-section,
.explanation-content-wrapper .form-section {
  background-color: #3f3f88;
  /* Slightly darker than the wrapper */
}

.preview-options {
  display: flex;
  gap: 1rem;
  color: #fff;
}

.section-toggle {
  width: 100%;
  padding: 1rem;
  margin: 1rem 0;
  background-color: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-weight: bold;
}

.section-toggle:hover {
  background-color: #333;
}

.json-preview {
  background: linear-gradient(145deg, #1a1a1a, #2d2d2d);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
}

/* Override vue-json-pretty theme for dark mode */
:deep(.vjs-tree) {
  color: #fff;
  background-color: #1a1a1a;
}

:deep(.vjs-key) {
  color: #9cdcfe;
}

:deep(.vjs-value) {
  color: #ce9178;
}

:deep(.vjs-primitive) {
  color: #b5cea8;
}

@media screen and (max-width: 991px) {
  .preview-controls {
    flex-direction: column;
    gap: 1rem;
  }

  .preview-controls-text {
    text-align: center;
    margin-right: 0;
    margin-bottom: 0.5rem;
  }

  .button-group {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }

  .preview-toggle,
  .return-button {
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
    flex: 1 1 auto;
    text-align: center;
    min-width: 120px;
  }

  .smaller-button {
    max-height: fit-content;
    font-size: 12px;
  }
}

.submit-status {
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
}

.submit-status.success {
  background-color: #4CAF50;
  color: white;
}

.submit-status.error {
  background-color: #f44336;
  color: white;
}

.status-message {
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
}

.status-message.success {
  background-color: #4CAF50;
  color: white;
}

.status-message.error {
  background-color: #f44336;
  color: white;
}

.submitted-preview {
  margin-top: 2rem;
  padding: .2rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.submitted-preview h3 {
  margin-bottom: 1rem;
  color: #333;
}

.explanation-toggles {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  margin: .7rem 1rem;
  padding: .7rem;
  background-color: white;
  border-radius: 8px;
}

.section-button {
  flex: 1;
  padding: 0.3rem .7rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
  background-color: #4a5568;
  color: white;
}

.section-button:hover {
  background-color: #2d3748;
}

.section-button.active {
  background-color: #4a90e2;
  color: white;
  border-color: #357abd;
}

@media (prefers-color-scheme: dark) {
  .section-button {
    background-color: #4a5568;
    color: white;
  }

  .section-button:hover {
    background-color: #2d3748;
  }

  .section-button.active {
    background-color: #4a90e2;
  }
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Or slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

.form-group:has(textarea) {
  margin-bottom: 12px;
}

.form-group:has(textarea) label {
  margin-top: 0;
}

input::placeholder,
textarea::placeholder {
  color: #aab7c4;
  transition: opacity 0.2s ease;
}

input:focus::placeholder,
textarea:focus::placeholder {
  opacity: 0;
}

/* When focused and empty */
input:focus:placeholder-shown,
textarea:focus:placeholder-shown {
  color: #ccc;
}

select {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(74, 144, 226, 0.2);
  border-radius: 8px;
  color: #333;
  font-size: 0.95rem;
  cursor: pointer;
}

select:focus {
  border-color: #4a90e2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
  outline: none;
}

optgroup {
  font-weight: bold;
  color: #4a90e2;
}

option {
  padding: 8px;
  color: #333;
}

.border-dashed {
  border-style: dashed !important;
}

.save-status-indicator {
  position: fixed;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  z-index: 50;
  animation: fadeInOut 3s ease-in-out;
  pointer-events: none;
}

.save-status-indicator.success {
  background-color: rgba(34, 197, 94, 0.9);
  color: white;
}

.save-status-indicator.error {
  background-color: rgba(239, 68, 68, 0.9);
  color: white;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateY(-1rem);
  }

  10% {
    opacity: 1;
    transform: translateY(0);
  }

  90% {
    opacity: 1;
    transform: translateY(0);
  }

  100% {
    opacity: 0;
    transform: translateY(-1rem);
  }
}

.save-draft-btn {
  background-color: #4a5568;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.save-draft-btn:hover {
  background-color: #2d3748;
}

.submit-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s;
}

.submit-btn-disabled {
  background-color: #9ca3af;
  color: #f3f4f6;
  cursor: not-allowed;
}

.submit-btn-disabled:hover {
  background-color: #6b7280;
}

.submit-btn-ready {
  background-color: #4f46e5;
  color: white;
}

.submit-btn-ready:hover {
  background-color: #4338ca;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 1px #4f46e5;
  outline: none;
}

.invalid-field {
  border: 2px solid #ef4444 !important;
  background-color: #fef2f2;
}

.invalid-field:focus {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 1px #ef4444 !important;
  outline: none;
}

.form-group {
  position: relative;
  margin-bottom: 1rem;
}

.invalid-field {
  border: 2px solid #ef4444 !important;
  background-color: #fef2f2;
  position: relative;
}

.invalid-field:hover::before {
  content: attr(data-error);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  background-color: #ef4444;
  color: white;
  padding: 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  white-space: nowrap;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.invalid-field:hover::after {
  content: '';
  position: absolute;
  bottom: calc(100% + 3px);
  left: 10px;
  border-width: 5px;
  border-style: solid;
  border-color: #ef4444 transparent transparent transparent;
}

.section-error-indicator {
  color: #ef4444;
  margin-left: 0.5rem;
  font-size: 1rem;
  vertical-align: middle;
}

/* Add this to your existing styles */
#template-select option {
  color: white !important;
  background-color: #3f3f88 !important;
}

.github-button {
  background-color: #2ea043;
  color: white;
}

.github-button:hover {
  background-color: #2c974b;
}

.yellow-text {
  color: #ffd700;
}
</style>
