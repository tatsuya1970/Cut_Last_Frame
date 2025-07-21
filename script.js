class VideoFrameExtractor {
    constructor() {
        this.video = document.getElementById('videoPreview');
        this.canvas = document.getElementById('resultCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.extractBtn = document.getElementById('extractBtn');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.resultContainer = document.getElementById('resultContainer');
        this.downloadLink = document.getElementById('downloadLink');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // ファイル選択
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // ドラッグ&ドロップ
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('video/')) {
                this.handleFileSelect(file);
            } else {
                this.showError('動画ファイルを選択してください。');
            }
        });

        // 抽出ボタン
        this.extractBtn.addEventListener('click', () => {
            this.extractLastFrame();
        });

        // 動画のメタデータ読み込み完了
        this.video.addEventListener('loadedmetadata', () => {
            this.extractBtn.disabled = false;
        });

        // 動画のエラー処理
        this.video.addEventListener('error', () => {
            this.showError('動画ファイルの読み込みに失敗しました。');
        });
    }

    handleFileSelect(file) {
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            this.showError('動画ファイルを選択してください。');
            return;
        }

        this.hideError();
        this.hideResult();
        this.extractBtn.disabled = true;

        const url = URL.createObjectURL(file);
        this.video.src = url;
        this.video.style.display = 'block';
        this.video.load();
    }

    async extractLastFrame() {
        try {
            this.showLoading();
            this.hideError();
            this.hideResult();

            // 動画の最後のフレームに移動
            await this.seekToLastFrame();
            
            // キャンバスサイズを動画サイズに設定
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            // 最後のフレームをキャンバスに描画
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

            // ダウンロードリンクを設定
            this.setupDownload();

            // 結果を表示
            this.showResult();

        } catch (err) {
            console.error('フレーム抽出エラー:', err);
            this.showError('フレームの抽出に失敗しました。動画ファイルを確認してください。');
        } finally {
            this.hideLoading();
        }
    }

    seekToLastFrame() {
        return new Promise((resolve, reject) => {
            const video = this.video;
            
            // 動画の最後のフレームに移動
            video.currentTime = video.duration;

            const onSeeked = () => {
                video.removeEventListener('seeked', onSeeked);
                video.removeEventListener('error', onError);
                resolve();
            };

            const onError = () => {
                video.removeEventListener('seeked', onSeeked);
                video.removeEventListener('error', onError);
                reject(new Error('動画のシークに失敗しました'));
            };

            video.addEventListener('seeked', onSeeked);
            video.addEventListener('error', onError);

            // タイムアウト処理
            setTimeout(() => {
                video.removeEventListener('seeked', onSeeked);
                video.removeEventListener('error', onError);
                reject(new Error('動画のシークがタイムアウトしました'));
            }, 10000);
        });
    }

    setupDownload() {
        // キャンバスからPNG画像を生成
        this.canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            this.downloadLink.href = url;
            this.downloadLink.download = `last_frame_${Date.now()}.png`;
        }, 'image/png');
    }

    showLoading() {
        this.loading.style.display = 'block';
        this.extractBtn.disabled = true;
    }

    hideLoading() {
        this.loading.style.display = 'none';
        this.extractBtn.disabled = false;
    }

    showError(message) {
        this.error.textContent = message;
        this.error.style.display = 'block';
    }

    hideError() {
        this.error.style.display = 'none';
    }

    showResult() {
        this.resultContainer.style.display = 'block';
        // 結果までスクロール
        this.resultContainer.scrollIntoView({ behavior: 'smooth' });
    }

    hideResult() {
        this.resultContainer.style.display = 'none';
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    new VideoFrameExtractor();
});

// ページの読み込み完了時の処理
window.addEventListener('load', () => {
    console.log('動画フレーム抽出アプリが読み込まれました');
}); 