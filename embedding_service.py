from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import numpy as np

app = Flask(__name__)

# Carica il modello all'avvio (supporta italiano)
print("Caricamento modello...")
# model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
model = SentenceTransformer('sentence-transformers/LaBSE')
print("Modello caricato!")

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    # return jsonify({'status': 'ok', 'model': 'paraphrase-multilingual-MiniLM-L12-v2'})
    return jsonify({'status': 'ok', 'model': 'sentence-transformers/LaBSE'})

@app.route('/embed', methods=['POST'])
def embed():
    """Genera embedding per un singolo testo"""
    data = request.json

    if not data or 'text' not in data:
        return jsonify({'error': 'Missing text parameter'}), 400

    text = data['text']
    embedding = model.encode(text).tolist()

    return jsonify({'embedding': embedding})

@app.route('/similarity', methods=['POST'])
def similarity():
    """Calcola similarità tra query e lista di testi"""
    data = request.json

    if not data or 'query' not in data or 'texts' not in data:
        return jsonify({'error': 'Missing query or texts parameter'}), 400

    query = data['query']
    texts = data['texts']

    if not isinstance(texts, list) or len(texts) == 0:
        return jsonify({'error': 'texts must be a non-empty list'}), 400

    # Genera embeddings
    query_emb = model.encode(query)
    text_embs = model.encode(texts)

    # Calcola similarità coseno
    similarities = np.dot(text_embs, query_emb) / (
        np.linalg.norm(text_embs, axis=1) * np.linalg.norm(query_emb)
    )

    return jsonify({'similarities': similarities.tolist()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)