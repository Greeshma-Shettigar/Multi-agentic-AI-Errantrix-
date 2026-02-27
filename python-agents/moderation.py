from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

app = FastAPI()

MODEL_NAME = "ibm-granite/granite-guardian-hap-38m"

print("Loading Granite Guardian HAP model...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

model.eval()

print("Model loaded successfully!")

# 🚨 Illegal keywords list
ILLEGAL_KEYWORDS = [
    "kill",
    "murder",
    "poison",
    "drug",
    "cocaine",
    "heroin",
    "gun",
    "weapon",
    "bomb",
    "explosive",
    "assassinate",
    "attack"
]

class TaskInput(BaseModel):
    text: str


@app.post("/moderate")
def moderate_task(task: TaskInput):

    text_lower = task.text.lower()

    # 1️⃣ Rule-based illegal check
    for word in ILLEGAL_KEYWORDS:
        if word in text_lower:
            return {"safe": False, "message": "Task contains illegal or harmful intent"}

    # 2️⃣ ML toxicity check
    inputs = tokenizer(task.text, return_tensors="pt")

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        prediction = torch.argmax(logits, dim=1).item()

    if prediction == 1:
        return {"safe": False, "message": "Task flagged as unsafe by AI model"}
    else:
        return {"safe": True, "message": "Task is safe"}