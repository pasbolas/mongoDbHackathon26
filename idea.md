# **Adaptive Memory Guardian**

## **One-line idea**

An AI accessibility assistant for people living with Alzheimer’s/dementia that learns how an individual performs everyday activities, detects when they appear to become stuck or confused, and provides the **minimum amount of assistance necessary**, gradually reducing that assistance when the person can perform the task independently.

The goal is not:

**How much can AI do for you?**

The goal is:

**How little does AI need to do for you?**

---

# **1. The Problem**

People living with dementia can struggle with everyday multistep activities such as:

- making tea or coffee
- preparing food
- getting ready in the morning
- using household appliances
- remembering what they were doing
- following the correct sequence of a task
- initiating an activity

Recent research specifically identifies difficulties with initiating activities and maintaining the sequence of multistep everyday tasks as areas where prompting technology may help. (PubMed)

Most technological approaches take one of two forms:

### **Basic reminders**

“Take your medication at 9:00.”

These know **when** something should happen but often don’t understand what the person is currently doing.

### **Step-by-step assistants**

“Pick up the kettle.”

“Fill the kettle.”

“Get the mug.”

“Get a tea bag.”

These can help complete a task, but risk providing assistance even when the person doesn’t need it.

Our idea asks a different question:

**Can technology recognize when someone actually needs help and otherwise leave them alone?**

---

# **2. Core Concept**

The system learns how a particular person normally performs familiar activities.

For example:

```
John's normal tea routine

Fill kettle
    ↓
Boil water
    ↓
Get blue mug
    ↓
Get tea bag
    ↓
Pour water
    ↓
Add milk
```

Over time, this becomes John’s personal baseline.

Now imagine:

```
Fill kettle
    ↓
Boil water
    ↓
Open cupboard
    ↓
Close cupboard
    ↓
Open cupboard again
    ↓
Stand still
```

The system sees that John’s behaviour has deviated from his usual pattern.

Instead of immediately taking control, it provides a small contextual cue:

“Your mug is in the cupboard.”

If that is enough, it stops helping.

If John remains stuck, assistance can become progressively more explicit:

```
Level 0

No assistance.

Level 1

"Your mug is nearby."

Level 2

"Your mug is in the cupboard."

Level 3

"Open the cupboard on your left and take the blue mug."
```

---

# **3. The Key Innovation: Vanishing Assistance**

We do **not** want the AI to become permanently necessary.

The system records whether each prompt actually helped.

Suppose initially John requires:

```
Week 1
7 prompts while making tea
```

After repeated successful completions:

```
Week 2
4 prompts
```

Eventually:

```
Week 3
2 prompts
```

The system therefore starts waiting longer or using weaker prompts.

Eventually:

```
John completes the step independently

→ no prompt
```

The AI deliberately tries to make itself unnecessary.

---

# **4. This Is Based on Real Dementia Research**

This isn’t an arbitrary AI mechanic.

There is an established cognitive rehabilitation approach called **Errorless Learning**.

Research reviewing 26 studies found that people with dementia can still learn or relearn meaningful everyday skills using error-reducing approaches, with benefits often maintained at follow-up. (PubMed Central (PMC))

One technique used in errorless learning is called **vanishing cues**.

The principle is:

```
Provide substantial assistance
        ↓
successful performance
        ↓
reduce assistance
        ↓
successful performance
        ↓
reduce again
        ↓
independent performance
```

The review describes vanishing cues as progressively withholding cues following successful recall until the correct response can be produced without them. It concludes that vanishing cues can reduce the amount of assistance needed and can be applied across different task types. (PubMed Central (PMC))

A randomized controlled trial has also studied structured relearning of everyday activities using errorless-learning techniques in people with Alzheimer’s or mixed dementia living at home. (PubMed Central (PMC))

This gives our product an actual research foundation.

---

# **5. Recent Research Supports Technology-Based Prompting**

A 2024 study tested technology-based prompts for everyday activities with people living with dementia in their homes.

It found that:

- people with dementia could engage with tablet prompts
- breaking complicated activities into smaller steps could improve completion and independence
- optimal prompt granularity differed between individuals
- personalization is important
- verbal instructions were particularly useful

(PubMed)

That last point matters.

There is **no universal ideal prompt**.

John might respond best to:

“Your mug is in the cupboard.”

Mary might respond better to:

```
[PHOTO OF HER MUG]
```

Someone else may need:

“Open the cupboard on your left.”

Our system therefore learns both:

```
WHEN should I intervene?
```

and

```
HOW should I intervene for this person?
```

---

# **6. Just-in-Time Intervention**

The U.S. National Institute on Aging has specifically highlighted **Just-in-Time Adaptive Interventions** for aging and Alzheimer’s/dementia research.

The idea is to use mobile/sensor technology to understand someone’s current state and context and provide the **appropriate amount and type of intervention at the right time**. (National Institute on Aging)

That maps directly onto our system.

Instead of:

```
9:00 → send reminder
```

we want:

```
observe context
      ↓
understand activity
      ↓
compare with personal history
      ↓
person progressing normally?
     /     \
   YES      NO
    ↓        ↓
  WAIT   determine assistance
             ↓
       smallest useful prompt
```

---

# **7. Personalized “Confusion Fingerprint”**

This is one of the features we should investigate further.

Different people may behave differently when they become stuck.

For example:

### **John’s normal behaviour**

```
Bedroom
   ↓
Bathroom
   ↓
Kitchen
   ↓
Breakfast
```

Possible difficulty:

```
Bedroom
   ↓
Hallway
   ↓
Bedroom
   ↓
Hallway
   ↓
Kitchen
   ↓
Hallway
```

Or while making tea:

### **Normal**

```
kettle → mug → tea bag → water
```

### **Possible difficulty**

```
kettle
  ↓
mug
  ↓
drawer
  ↓
fridge
  ↓
drawer
  ↓
idle
```

Instead of building a universal:

“THIS BEHAVIOUR = CONFUSION”

model, we build a personal behavioural baseline.

---

# **8. Why Personalization Matters**

A 2025 narrative review examined **78 studies** involving anomaly-detection technology for people living with dementia.

Existing systems already use technologies including:

- GPS
- wearables
- environmental sensors
- smart-home systems

for things such as wandering, sleep disturbance and other behavioural changes.

However, the review identifies challenges including false positives, privacy and user compliance. (PubMed)

Therefore:

**“We detect abnormal behaviour in dementia patients”**

is NOT our novelty.

That already exists.

Our distinction is:

**Learn how this individual performs meaningful everyday tasks, detect when they appear to require assistance, determine the smallest useful intervention, and adapt future assistance based on whether it worked.**

---

# **9. Prior Art We Need To Be Honest About**

Context-aware dementia prompting itself is also not new.

The **COACH** research system used AI to autonomously guide people with dementia through handwashing using audio/audio-video prompts. (PubMed Central (PMC))

Researchers have also built context-sensitive prompting systems specifically around tasks such as making tea. (ScienceDirect)

Personalized digital prompting systems have allowed carers to define multistep everyday activities for people with dementia. (PubMed Central (PMC))

IBM also patented a real-time cognitive-assistance approach involving:

```
environmental sensors
        ↓
identify user context
        ↓
predict likely cognitive task
        ↓
calculate confidence
        ↓
decide whether to prompt
```

(Google Patents)

Therefore we should **never pitch**:

“Nobody has ever made an AI that detects when someone needs help.”

That claim would be false.

---

# **10. Where Our Novelty Actually Is**

Our proposed contribution is the combination:

```
PERSONAL BEHAVIOURAL HISTORY
           +
TASK-SEQUENCE UNDERSTANDING
           +
PERSONAL CONFUSION PATTERNS
           +
CONTEXT-AWARE INTERVENTION
           +
ADAPTIVE PROMPT STRENGTH
           +
PROMPT EFFECTIVENESS HISTORY
           +
VANISHING ASSISTANCE
           ↓
MINIMUM NECESSARY INTERVENTION
```

Most AI assistants optimize for doing more.

Our assistant optimizes for **intervening less**.

The success metric isn’t:

“How many tasks did AI complete?”

It becomes:

**“How many tasks did the person complete independently?”**

---

# **11. Why MongoDB Atlas?**

MongoDB should not just be where we save usernames.

**MongoDB Atlas becomes the longitudinal memory of the accessibility system.**

It stores how this specific individual behaves across time.

Example:

```json
{
  "user": "John",

  "task": "make_tea",

  "normalSequence": [
    "fill_kettle",
    "boil_water",
    "get_mug",
    "get_teabag",
    "pour_water",
    "add_milk"
  ],

  "assistance": {
    "get_mug": {
      "attempts": 27,
      "independentCompletions": 19,
      "currentPromptLevel": 1
    }
  }
}
```

---

# **12. MongoDB Atlas Vector Search**

We can represent situations as embeddings.

Current situation:

```
John is in kitchen.
Kettle has boiled.
Cupboard opened twice.
No mug retrieved.
Idle for 25 seconds.
```

MongoDB Vector Search can retrieve semantically similar previous situations.

MongoDB’s official documentation confirms that Vector Search can create indexes over embeddings and perform semantic nearest-neighbour retrieval using `$vectorSearch`. (MongoDB)

Example:

```
CURRENT SITUATION
       ↓
embedding
       ↓
MongoDB Atlas Vector Search
       ↓

Similar historical situations:

94%
John forgot where mug was

89%
John became stuck making coffee

73%
John was looking for cereal
```

The AI can then reason using **John’s actual history**, rather than treating every person identically.

---

# **13. MongoDB Time-Series Data**

We can also store behavioural/sensor events over time.

Example:

```json
{
  "timestamp": "10:32:04",
  "task": "make_tea",
  "action": "open_cupboard"
}
```

```json
{
  "timestamp": "10:32:11",
  "task": "make_tea",
  "action": "close_cupboard"
}
```

```json
{
  "timestamp": "10:32:17",
  "task": "make_tea",
  "action": "open_cupboard"
}
```

MongoDB supports time-series collections specifically for measurements and observations where analysing changes over time matters. (MongoDB)

This gives us longitudinal behaviour:

```
TIME
 ↓

actions
routines
interruptions
prompts
responses
successful completion
```

---

# **14. MongoDB Atlas Triggers**

When the system records something requiring intervention:

```json
{
  "task": "make_tea",
  "state": "possible_confusion",
  "confidence": 0.91
}
```

an Atlas Database Trigger could execute application logic.

MongoDB documents that Atlas Database Triggers can respond to inserts, updates, replacements and deletions and execute server-side logic or forward events externally. (MongoDB)

Architecture:

```
Behaviour detected
       ↓
MongoDB event inserted
       ↓
Atlas Trigger
       ↓
Intervention engine
       ↓
Check previous successful prompts
       ↓
Select minimum prompt
       ↓
Phone / speaker / wearable
```

---

# **15. Full Architecture**

```
Camera / phone / sensors
            ↓
      AI perception
            ↓
"What is happening right now?"
            ↓
       MongoDB Atlas
            │
 ┌──────────┼──────────────┐
 │          │              │
 ▼          ▼              ▼
Routines   Events      Prompt history
 │          │              │
 └──────────┼──────────────┘
            ↓
       Vector Search
            ↓
Similar historical situations
            ↓
      Decision engine
            ↓
     Does user need help?
       /           \
     NO             YES
     ↓               ↓
   WAIT        Prompt Level 1
                     ↓
                Still stuck?
                  /     \
                NO       YES
                ↓         ↓
              STOP    Level 2
```

Every result goes back into Atlas:

```
prompt
 ↓
user response
 ↓
successful?
 ↓
MongoDB
 ↓
future behaviour changes
```

This creates a feedback loop.

---

# **16. Example Demo**

We simulate someone making tea.

### **Step 1**

User picks up kettle.

Nothing happens.

### **Step 2**

User fills kettle.

Nothing happens.

### **Step 3**

User boils water.

Nothing happens.

### **Step 4**

User appears confused and repeatedly checks different cupboards.

The system detects deviation from the stored routine.

MongoDB Vector Search retrieves previous similar situations.

It discovers:

```
Previous occurrence:

Problem:
Couldn't locate mug.

Successful intervention:
"Your mug is in the cupboard beside the fridge."

Prompt level:
1
```

System says:

**“Your mug is in the cupboard beside the fridge.”**

User retrieves mug.

System stops assisting.

MongoDB records:

```
Level 1 prompt successful.
```

---

# **17. Now Show the Adaptive Part**

On the dashboard:

```
MAKING TEA

Week 1
███████░░░ 72% independent
7 prompts

Week 2
████████░░ 81% independent
4 prompts

Week 3
█████████░ 89% independent
2 prompts
```

The judge immediately understands:

The system is learning to **help less**.

---

# **18. Another Powerful Demo**

Have the person deliberately perform the task correctly.

The judge expects AI to say something.

Instead:

```
AI: nothing.
```

Then explain:

**That’s the feature.**

The system recognized that the person was successfully completing the activity and deliberately chose not to interfere.

That demonstrates our philosophy immediately.

---

# **19. Privacy**

This is a serious issue because the system potentially observes someone’s home behaviour.

The anomaly-detection literature specifically identifies privacy as a challenge in dementia-monitoring technology. (PubMed)

Therefore our design should avoid:

```
24/7 video stored in cloud
```

where possible.

Better:

```
Camera
  ↓
local AI processing
  ↓
"cupboard opened"
"picked up kettle"
"standing idle"
  ↓
MongoDB
```

Store **events**, not necessarily raw video.

For the hackathon we can simulate the perception layer rather than claim we’ve solved privacy.

---

# **20. Important Safety Boundary**

We should position this as:

**Assistive technology supporting everyday independence**

NOT:

medical diagnosis

NOT:

dementia detection

NOT:

replacement for a caregiver

NOT:

emergency medical monitoring

The system identifies deviations from learned task patterns. It does **not** diagnose confusion, Alzheimer’s progression or medical deterioration.

---

# **21. MVP for the Hackathon**

Do NOT attempt to recognize someone’s entire life.

Build **one activity extremely well**.

Example:

### **Making tea**

Implement:

1. Task sequence stored in MongoDB Atlas.
2. Simulated/camera-based recognition of task steps.
3. Event history stored in Atlas.
4. Detect deviation from normal sequence.
5. Vector Search previous similar situations.
6. Retrieve previous successful intervention.
7. Generate Level 1 prompt.
8. Escalate to Level 2 if necessary.
9. Record whether prompt succeeded.
10. Reduce future assistance.
11. Dashboard showing independence increasing.

That is enough for a strong demo.

---

# **22. Future Expansion**

Once the concept works:

```
Making tea
```

can become:

```
Making breakfast

Taking medication

Getting dressed

Preparing to leave home

Using appliances

Finding familiar objects

Following morning routine

Completing hygiene routines
```

The architecture stays the same.

---

# **23. Why This Fits the Judging Criteria**

## **Creativity**

The AI is intentionally designed to **do less over time**, which reverses the normal AI-assistant model.

## **Originality**

We’re combining dementia rehabilitation principles such as vanishing cues/errorless learning with personalized longitudinal behavioural intelligence and adaptive AI intervention.

We should describe this as our **combination and implementation approach**, not claim that its individual components have never existed.

## **Novelty**

The interesting technical question becomes:

**Can an AI learn the minimum amount of assistance a specific person requires in a specific context?**

Instead of:

“Can AI tell someone how to make tea?”

---

# **24. Pitch**

**Most AI assistants are designed to do more and more for you. For someone living with dementia, that isn’t always the right goal.**

> 
> 

**We’re building an accessibility assistant designed to make itself less necessary.**

> 
> 

It learns how an individual performs everyday activities, recognizes when their behaviour deviates from their personal routine, and uses their historical data in MongoDB Atlas to determine the smallest useful intervention.

> 
> 

If a small reminder works, it stops. If more help is required, the prompt becomes progressively clearer.

> 
> 

Most importantly, when someone successfully performs an activity, the system gradually removes assistance using principles inspired by errorless learning and vanishing cues.

> 
> 

**Our measure of success isn’t how much the AI can do. It’s how much the person can continue doing themselves.**

---

# **Research / Sources**

**Errorless learning and vanishing cues**

Errorless learning of everyday tasks in people with dementia, PubMed Central

Review of 26 studies examining meaningful everyday activities in people with dementia. Supports errorless learning, stepwise training and progressively reducing cues. (PubMed Central (PMC))

**Randomized controlled trial**

REDALI-DEM randomized controlled trial, Alzheimer’s Research & Therapy

Investigated structured relearning of everyday activities using errorless-learning techniques in people with Alzheimer’s or mixed dementia living at home. (PubMed Central (PMC))

**Modern technology-based dementia prompting research**

Optimizing Technology-Based Prompts for People Living With Dementia, PubMed

2024 experimental work on prompt modality, multistep task breakdown and attentional support. Shows the importance of personalization and appropriate task granularity. (PubMed)

**Just-in-Time Adaptive Interventions**

National Institute on Aging workshop on Just-in-Time interventions for aging and Alzheimer’s disease

NIA describes using sensors/mobile technologies to understand individual context and deliver an appropriate intervention at the appropriate time. (National Institute on Aging)

**Dementia anomaly detection**

Anomaly Detection Technologies for Dementia Care, PubMed

2025 review covering 78 studies using GPS, wearables, environmental sensors and smart-home technologies. Useful evidence for both the opportunity and existing prior art. (PubMed)

**Existing AI dementia prompting system**

The COACH prompting system, PubMed Central

Important prior art. COACH used AI and audio/audio-video prompts to guide people with dementia through handwashing. (PubMed Central (PMC))

**Existing personalized digital prompter**

Client-centred prompting tool for everyday dementia activities, PubMed Central

Shows carers defining personalized multistep activities and people with dementia following those prompts. (PubMed Central (PMC))

**Context-aware cognitive-assistance patent**
