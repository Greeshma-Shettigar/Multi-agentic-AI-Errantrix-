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
    #  Violence / Crime
    "kill", "murder", "assassinate", "attack", "stab", "shoot",
    "kidnap", "abduct", "torture", "threat", "violence",

    # Weapons / Explosives
    "gun", "pistol", "rifle", "weapon", "bomb", "explosive",
    "grenade", "ammo", "ammunition", "detonator",

    #  Drugs / Narcotics
    "drug", "cocaine", "heroin", "weed", "marijuana",
    "lsd", "mdma", "ecstasy", "meth", "opium", "charas", "ganja",

    # Alcohol / Substances (add this as you asked)
    "alcohol", "liquor", "beer", "vodka", "whiskey", "rum",
    "wine", "drunk", "intoxicated",

    #  Poison / Harm
    "poison", "toxic", "overdose", "suicide", "self-harm",

    #  Illegal Activities
    "smuggling", "blackmail", "fraud", "scam", "steal",
    "robbery", "hack", "hacking", "phishing",

    #  Abuse / Harmful intent
    "abuse", "harass", "bully", "rape", "molest",

    #  Genz / risky slang (carefully chosen)
    "get high", "dope", "stash", "hitman", "deal drugs"
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