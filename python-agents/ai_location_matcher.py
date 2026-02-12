from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


class AILocationMatcher:

    def __init__(self):

        # Pretrained BERT model
        self.model = SentenceTransformer(
            "all-MiniLM-L6-v2"
        )

        # Known locations (can load from DB later)
        self.known_places = {
            "Udupi Bus Stand": (13.3410, 74.7465),
            "Manipal University": (13.3525, 74.7923),
            "MIT Manipal": (13.3525, 74.7923),
            "Tiger Circle Manipal": (13.3531, 74.7912)
        }

        self.embeddings = self.model.encode(
            list(self.known_places.keys())
        )

    def match(self, user_text):

        query_vec = self.model.encode([user_text])

        scores = cosine_similarity(
            query_vec,
            self.embeddings
        )[0]

        best_idx = scores.argmax()

        best_place = list(self.known_places.keys())[best_idx]

        confidence = scores[best_idx]

        return best_place, confidence
