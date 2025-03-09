<template>
  <div class="youtube-embed">
    <div class="video-container">
      <iframe :src="embedUrl" frameborder="0" sandbox="allow-scripts allow-same-origin allow-presentation"
        referrerpolicy="no-referrer" loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen
        @load="onIframeLoad" title="YouTube video player"></iframe>
    </div>
  </div>
</template>

<script>
export default {
  name: 'YouTubeEmbed',
  props: {
    videoId: {
      type: String,
      required: true
    },
    startTime: {
      type: Number,
      default: 0
    }
  },
  computed: {
    embedUrl() {
      try {
        return `https://www.youtube.com/embed/${this.videoId}?rel=0&showinfo=0&autoplay=0&start=${this.startTime}`;
      } catch (error) {
        console.error('Error creating YouTube embed URL:', error);
        return '';
      }
    }
  },
  methods: {
    onIframeLoad(event) {
      try {
        console.log('Iframe loaded, dimensions:', {
          width: event.target.offsetWidth,
          height: event.target.offsetHeight
        });
      } catch (error) {
        console.error('Error in iframe load handler:', error);
      }
    }
  },
  mounted() {
    try {
      console.log('YouTube component mounted, videoId:', this.videoId);
    } catch (error) {
      console.error('Error in YouTube component mount:', error);
    }
  },
  updated() {
    try {
      console.log('YouTube component updated, videoId:', this.videoId);
    } catch (error) {
      console.error('Error in YouTube component update:', error);
    }
  }
}
</script>

<style scoped>
.youtube-embed {
  width: 100%;
  max-width: 100%;
}

.video-container {
  position: relative;
  padding-bottom: 56.25%;
  /* 16:9 Aspect Ratio */
  height: 0;
  overflow: hidden;
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>