from transformers import (
    AutoTokenizer,
    M2M100ForConditionalGeneration,
    Seq2SeqTrainingArguments,
    Seq2SeqTrainer,
    DataCollatorForSeq2Seq
)
from datasets import load_dataset
from evaluate import load as load_metric
import numpy as np

model = M2M100ForConditionalGeneration.from_pretrained("Swamitucats/M2M100_Sanskrit_English")
tokenizer = AutoTokenizer.from_pretrained("Swamitucats/M2M100_Sanskrit_English")

dataset = load_dataset('csv', data_files={'train': 'balanced_train.csv', 'test': 'normalized_test.csv'})

tokenizer.src_lang = "sa"       #this line giving error
tokenizer.tgt_lang = "en"
def preprocess(examples):
    
    tokenizer.src_lang = "sa"
    tokenizer.tgt_lang = "en"
    model_inputs = tokenizer(
        examples['sanskrit'],
        max_length=128,
        truncation=True,
        padding='max_length'
    )

    with tokenizer.as_target_tokenizer():
        labels = tokenizer(
            examples['english'],
            max_length=128,
            truncation=True,
            padding='max_length'
        )

    model_inputs['labels'] = labels['input_ids']
    return model_inputs

data_collator = DataCollatorForSeq2Seq(tokenizer, model=model)
from transformers import Seq2SeqTrainingArguments

training_args = Seq2SeqTrainingArguments(
    output_dir="./sanskrit-english-finetuned",
    # evaluation_strategy="epoch",         # Evaluate every epoch
    learning_rate=2e-5,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    weight_decay=0.01,
    save_total_limit=3,
    num_train_epochs=5,
    predict_with_generate=True,
    fp16=True,
    logging_steps=100,
    report_to="none"
)

# 6. Metric computation
metric = load_metric("sacrebleu")

def compute_metrics(eval_preds):
    preds, labels = eval_preds
    decoded_preds = tokenizer.batch_decode(preds, skip_special_tokens=True)
    
    labels = np.where(labels != -100, labels, tokenizer.pad_token_id)
    decoded_labels = tokenizer.batch_decode(labels, skip_special_tokens=True)
    
    result = metric.compute(predictions=decoded_preds, references=[[ref] for ref in decoded_labels])
    return {"bleu": result["score"]}


tokenized_datasets = dataset.map(preprocess, batched=True)  #this line giving error

trainer = Seq2SeqTrainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_datasets["train"],
    eval_dataset=tokenized_datasets["test"],
    data_collator=data_collator,
    compute_metrics=compute_metrics,
    tokenizer=tokenizer
)

trainer.train()
model.save_pretrained("./final-model")
tokenizer.save_pretrained("./final-model")