/* =============================================
   BCI Quiz — Analytics & Dashboard Engine
   Calculates accuracy, average speed, study heatmap,
   topic mastery progress bars, & score statistics.
   ============================================= */

const AnalyticsEngine = {
  // Render Dashboard Summary Stats
  renderDashboard(stats) {
    const totalQs = stats.totalQs || 0;
    const totalCorrect = stats.totalCorrect || 0;
    const totalWrong = stats.totalWrong || 0;
    const accuracy = totalQs > 0 ? ((totalCorrect / totalQs) * 100).toFixed(1) : '0.0';
    const totalTimeSec = stats.totalTimeSeconds || 0;
    const avgSpeedSec = totalQs > 0 ? (totalTimeSec / totalQs).toFixed(1) : '0';

    // Update UI Stats Cards
    const elTotal = document.getElementById('statTotalQs');
    const elAccuracy = document.getElementById('statAccuracy');
    const elScore = document.getElementById('statScore');
    const elSpeed = document.getElementById('statSpeed');

    if (elTotal) elTotal.textContent = totalQs;
    if (elAccuracy) elAccuracy.textContent = `${accuracy}%`;
    if (elScore) elScore.textContent = (stats.totalScore || 0).toFixed(2);
    if (elSpeed) elSpeed.textContent = `${avgSpeedSec}s / Q`;

    // Render Study Heatmap
    this.renderHeatmap(stats.dailyActivity || {});

    // Render Topic Mastery Bars
    this.renderTopicMastery(stats.topicStats || {});
  },

  // Render GitHub-Style Study Activity Heatmap
  renderHeatmap(dailyActivity) {
    const container = document.getElementById('studyHeatmapContainer');
    if (!container) return;

    container.innerHTML = '';
    const today = new Date();
    const daysToShow = 28; // Past 4 weeks

    const grid = document.createElement('div');
    grid.className = 'heatmap-grid';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
    grid.style.gap = '6px';
    grid.style.marginTop = '12px';

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = dailyActivity[dateStr] || 0;

      let intensity = 'level-0';
      if (count > 0 && count <= 10) intensity = 'level-1';
      else if (count > 10 && count <= 30) intensity = 'level-2';
      else if (count > 30 && count <= 60) intensity = 'level-3';
      else if (count > 60) intensity = 'level-4';

      const cell = document.createElement('div');
      cell.className = `heatmap-cell ${intensity}`;
      cell.title = `${dateStr}: ${count} questions solved`;
      cell.style.aspectRatio = '1';
      cell.style.borderRadius = '4px';
      cell.style.background = this.getHeatmapColor(intensity);
      cell.style.transition = 'transform 0.2s ease';
      cell.onmouseover = () => cell.style.transform = 'scale(1.15)';
      cell.onmouseout = () => cell.style.transform = 'scale(1)';

      grid.appendChild(cell);
    }

    container.appendChild(grid);
  },

  getHeatmapColor(level) {
    switch (level) {
      case 'level-1': return '#c6e48b';
      case 'level-2': return '#7bc96f';
      case 'level-3': return '#239a3b';
      case 'level-4': return '#196127';
      default: return 'var(--border)';
    }
  },

  // Render Topic Mastery Progress Bars
  renderTopicMastery(topicStats) {
    const container = document.getElementById('topicMasteryContainer');
    if (!container) return;

    container.innerHTML = '';
    const topics = Object.keys(topicStats);

    if (topics.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted); font-size:13px; text-align:center; padding:16px;">
        No topic stats yet. Complete a quiz to track topic mastery.
      </div>`;
      return;
    }

    topics.forEach(tName => {
      const ts = topicStats[tName];
      const acc = ts.total > 0 ? Math.round((ts.correct / ts.total) * 100) : 0;

      const item = document.createElement('div');
      item.className = 'topic-mastery-item';
      item.style.marginBottom = '12px';

      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:600; margin-bottom:4px;">
          <span>${tName}</span>
          <span style="color:${acc >= 70 ? '#10b981' : (acc >= 50 ? '#f59e0b' : '#ef4444')}">${acc}% (${ts.correct}/${ts.total})</span>
        </div>
        <div style="width:100%; height:8px; background:var(--border); border-radius:99px; overflow:hidden;">
          <div style="width:${acc}%; height:100%; background:${acc >= 70 ? '#10b981' : (acc >= 50 ? '#f59e0b' : '#ef4444')}; border-radius:99px; transition:width 0.4s ease;"></div>
        </div>
      `;
      container.appendChild(item);
    });
  }
};

window.AnalyticsEngine = AnalyticsEngine;
