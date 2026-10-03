"""Seed the Blast Radius demo through the REAL logic functions.

Usage:
    python seed.py            # reset, seed, print summary, write seed_backup.json
    python seed.py --mock     # same, but in memory (no Atlas)
    python seed.py --no-reset # add on top of what is there (rarely wanted)

Order matters, Dev asks before v3 exists:
    v1, Ravi, v2, Aoife, Tom, Mei, note, Dev, v3
"""
import argparse
import json
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)

# guide text, hand written (the only hand written data)
ENTRY_1 = ("Workspace access",
           "Ask the team lead for an invite to the shared project. "
           "Accept it within two days or it expires.")
ENTRY_3 = ("Networking basics",
           "A firewall rule decides which traffic can reach a service. "
           "Allow only the addresses you need and review the rules every week.")
ENTRY_5 = ("Deploying the demo app",
           "Build the container, push it to the team registry, then run the "
           "deploy script. Check the health page after two minutes.")

HEAD = "Database setup for dev clusters. Create a cluster in the shared project. "
TAIL = " Keep the connection string in the team vault."
V1 = ("Database setup",
      HEAD + "Set the IP access list to the venue wifi address 203.0.113.25 only." + TAIL)
V2 = HEAD + ("For dev clusters, set the IP access list to 0.0.0.0/0 (temporary). "
             "This lets the whole team connect first try.") + TAIL
V3 = HEAD + ("Add only the venue wifi address 203.0.113.25 to the IP access list. "
             "Never open the list to the whole internet. "
             "If a teammate cannot connect, add their own address.") + TAIL

# demo questions
Q_RAVI = "How do I set up the database for a dev cluster?"
Q_AOIFE = "How do I set up a dev cluster database?"
Q_TOM = "What is the way to set up a database on a dev cluster?"
Q_MEI = "Steps to set up the dev cluster database please"
Q_DEV = ("Which firewall rules apply to our project, can the team connect "
         "from any wifi, and which traffic can reach the service?")
Q_AFTER = "How do I connect to the dev database cluster?"

# Aoife's note has extra words so Dev's question picks it over v2
NOTE_TEXT = ("Dev database setup that worked for me: set the IP access list to "
             "0.0.0.0/0 (temporary). The team can connect from any wifi first "
             "try. Firewall rules apply to our project traffic, and the service "
             "can reach the cluster.")


def seed(reset=True):
    """Run the whole story. Returns a dict of the ids that were created."""
    from app.db import reset_db
    from app import logic

    if reset:
        reset_db()
    ids = {}

    logic.edit_entry("entry_1", ENTRY_1[1], "Sam", title=ENTRY_1[0])
    logic.edit_entry("entry_3", ENTRY_3[1], "Sam", title=ENTRY_3[0])
    logic.edit_entry("entry_5", ENTRY_5[1], "Sam", title=ENTRY_5[0])

    ids["v1"] = logic.edit_entry("entry_7", V1[1], "Sam", title=V1[0])["_id"]
    ids["ravi"] = logic.ask("Ravi", Q_RAVI)["id"]

    ids["v2"] = logic.edit_entry("entry_7", V2, "Sam")["_id"]
    ids["aoife"] = logic.ask("Aoife", Q_AOIFE)["id"]
    ids["tom"] = logic.ask("Tom", Q_TOM)["id"]
    ids["mei"] = logic.ask("Mei", Q_MEI)["id"]
    ids["note"] = logic.save_note("Aoife", ids["aoife"], NOTE_TEXT)["_id"]
    ids["dev"] = logic.ask("Dev", Q_DEV)["id"]

    ids["v3"] = logic.edit_entry("entry_7", V3, "Priya")["_id"]

    logic.mark_applied(ids["aoife"], "Aoife")
    logic.mark_applied(ids["tom"], "Tom")
    return ids


def check(ids):
    """Sanity check the story. Returns a list of problems (empty is good)."""
    from app import logic
    from app.db import get_items

    bad = []
    down = set(logic.walk_down(ids["v2"]))
    want = {ids[k] for k in ("v2", "aoife", "tom", "mei", "note", "dev")}
    if down != want:
        bad.append("walk_down(v2) = %s, wanted %s" % (sorted(down), sorted(want)))
    if set(logic.walk_down(ids["v1"])) != {ids["v1"], ids["ravi"]}:
        bad.append("walk_down(v1) is not v1 + Ravi")
    if logic.walk_down(ids["v3"]) != [ids["v3"]]:
        bad.append("walk_down(v3) is not just v3")
    items = get_items()
    for k in ("aoife", "tom", "mei"):
        p = items.find_one({"_id": ids[k]})["parents"]
        if p != [ids["v2"]]:
            bad.append("%s parents = %s, wanted only v2" % (k, p))
    if items.find_one({"_id": ids["ravi"]})["parents"] != [ids["v1"]]:
        bad.append("ravi parents is not [v1]")
    dev_p = items.find_one({"_id": ids["dev"]})["parents"]
    if dev_p != [ids["note"], "entry_3_v1"]:
        bad.append("dev parents = %s, wanted [note, entry_3_v1]" % dev_p)
    line = logic.blast_radius(ids["v2"])["line"]
    exp = "1 edit, 4 answers, 1 note, 4 people reached, 2 confirmed applied"
    if line != exp:
        bad.append("line = %r" % line)
    return bad


def write_backup(path):
    from app import logic
    docs = logic.state()
    with open(path, "w") as f:
        json.dump(docs, f, indent=2)
    return len(docs)


def main():
    p = argparse.ArgumentParser(description="Seed the Blast Radius demo data")
    p.add_argument("--reset", action=argparse.BooleanOptionalAction, default=True,
                   help="clear the items collection first (default on)")
    p.add_argument("--mock", action="store_true",
                   help="use mongomock in memory, no Atlas")
    args = p.parse_args()

    if args.mock:
        os.environ["USE_MOCK"] = "1"
    try:
        from dotenv import load_dotenv
        load_dotenv(os.path.join(ROOT, ".env"))
    except ImportError:
        pass

    from app import logic
    ids = seed(reset=args.reset)
    problems = check(ids)

    br = logic.blast_radius(ids["v2"])
    s = br["summary"]
    print("Blast radius of %s: %s" % (ids["v2"], br["line"]))
    print("  asked directly: %s | second hand: %s | applied: %s"
          % (", ".join(s["direct"]), ", ".join(s["second_hand"]),
             ", ".join(s["applied"])))

    n = write_backup(os.path.join(ROOT, "seed_backup.json"))
    print("Wrote seed_backup.json (%d docs)" % n)

    if problems:
        print("\nSEED CHECK FAILED:")
        for x in problems:
            print("  - " + x)
        sys.exit(1)
    print("Seed check passed.")


if __name__ == "__main__":
    main()
