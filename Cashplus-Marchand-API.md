# CashPlus Marchand API

## CashPlus 2025

## Contexte

Cash Plus permet aux marchands de profiter de son large réseau d’agences pour récupérer des paiements clients.

Toutes les requêtes sont en POST et sous le format JSON.

## Génération de token

Génère un token de paiement à communiquer au client final.

**URL :**

```text
/cpws/cpmarchand/index.cfm?endpoint=/generate_token
```

### Requête JSON

| Champ | Description | Type | Obligatoire |
|---|---|---|---|
| `request_id` | Identifiant unique de votre demande | `string` | Oui |
| `amount` | Montant du panier | `numeric` | Oui |
| `fees` | Frais liés au panier qui peut être 0 | `numeric` | Oui |
| `marchand_code` | Code marchand délivré par CashPlus | `string` | Oui |
| `hmac` | `UPPERCASE(SHA2(marchand_code + secret_key + amount))` ; le `secret_key` est délivré par CashPlus | `string` | Oui |
| `json_data` | Informations complémentaires sous forme JSON, ex : `[{"value": "valeur_champ_1", "key": "nom_champ_1"}, {"value": "valeur_champ_2", "key": "nom_champ_2"}, {"value": "valeur_champ_3", "key": "nom_champ_3"}]` | `string` | non |
| `date_expiration` | La date d’expiration du paiement token doit être sous forme `yyyy-mm-dd HH:nn:ss` ; exemple : `2021-01-01 10:00:00` | `string` | non |

- Si les frais sont à la charge du marchand, le champ `fees` doit être égal à `0`. La commission va être déduite implicitement.
- Si les frais sont à la charge du client, le champ `fees` doit contenir la valeur de la commission définie selon le contrat.

### Réponse

```json
{
  "SUCCESS": 1,
  "TOKEN": "cm442xq9k7",
  "DATE_EXPIRATION": "2021-02-01 00:00:00"
}
```

En cas d’erreur, `SUCCESS` est mis à `0` et accompagné par un message d’erreur.

Exemple d’échec de la requête :

```json
{
  "SUCCESS": 0,
  "MESSAGE": "La valeur du code marchand est incorrecte"
}
```

## Statut token

Ce service renvoie l’état d’un token, payé ou pas, sous forme d’un champ booléen `IS_PAID`, accompagné de la date de paiement `DATE_PAID`.

Le champ `STATE` donne plus de précision. Ses différentes valeurs sont :

- `new` : nouveau token non expiré
- `expired` : token expiré qui ne peut pas être payé
- `paid` : token payé

**URL :**

```text
/cpws/cpmarchand/index.cfm?endpoint=/status_token
```

### Requête

| Champ | Description | Type | Obligatoire |
|---|---|---|---|
| `token` | Le token généré | `string` | Oui |
| `marchand_code` | Code marchand délivré par CashPlus | `string` | Oui |
| `hmac` | `UPPERCASE(SHA2(marchand_code + secret_key))` ; le `secret_key` est délivré par CashPlus | `string` | Oui |

Exemple de requête :

```json
{
  "hmac": "",
  "token": "",
  "marchand_code": ""
}
```

Exemple succès de la requête :

```json
{
  "MESSAGE": "",
  "SUCCESS": 1,
  "IS_PAID": true,
  "STATE": "paid",
  "DATE_PAID": "2019-06-24 17:28:46"
}
```

Ou bien :

```json
{
  "MESSAGE": "",
  "SUCCESS": 1,
  "IS_PAID": false,
  "STATE": "new"
}
```

Exemple échec de la requête :

```json
{
  "MESSAGE": "Token non trouvé",
  "SUCCESS": 0
}
```

## Statut tokens par période

Retourne la liste des paiements effectués depuis une date donnée. Le nombre maximum de paiements retournés ne doit pas dépasser une limite fixée dans le système.

**URL :**

```text
/cpws/cpmarchand/index.cfm?endpoint=/token_status_for_period
```

### Requête

| Champ | Description | Type | Obligatoire |
|---|---|---|---|
| `date_request` | Date limite des tokens payés | `string` | Oui |
| `marchand_code` | Code marchand délivré par CashPlus | `string` | Oui |
| `hmac` | `UPPERCASE(SHA2(marchand_code + secret_key))` ; le `secret_key` est délivré par CashPlus | `string` | Oui |

- Le service renvoie les 100 tokens payés après la `date_request`.
- La `date_request` est incluse.
- Le format de la `date_request` est `yyyy-MM-dd HH:nn:ss`.

Exemple de requête :

```json
{
  "hmac": "",
  "date_request": "2018-09-10 18:00:00",
  "marchand_code": ""
}
```

Exemple succès de la requête :

```json
{
  "MESSAGE": "",
  "SUCCESS": 1,
  "TOKENS_STATUS": [
    {
      "token_code": "cm3wortfaq",
      "request_id": 336,
      "date_paid": "2018-09-11 22:50:22"
    },
    {
      "token_code": "cm10oqa5w9",
      "request_id": 41,
      "date_paid": "2018-09-12 17:36:00"
    }
  ]
}
```

Exemple échec de la requête :

```json
{
  "MESSAGE": "Date invalide",
  "SUCCESS": 0,
  "TOKENS_STATUS": []
}
```

## Callback paiement

Les marchands peuvent recevoir une notification immédiate après le paiement d’un token. Ils devront pour cela fournir une URL à CashPlus qui sera appelée par le service de paiements comme suit :

```text
https://marchandDomain.com/.../callbackCashplus
```

L’appel est en mode POST.

### Paramètres

- `request_id` contient la valeur envoyée par le marchand lors de la génération du token.
- `hmac = UPPERCASE(SHA2(request_id + secret_key))`
- D’autres moyens de callback peuvent être mis en place si nécessaire pour s’adapter aux spécificités de chaque marchand.

Le callback doit renvoyer le message `OK` en cas de succès et `NOK` en cas d’erreur.
