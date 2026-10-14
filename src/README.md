# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Sign up for activities
- Unregister participants from activities

## Getting Started

1. Install the dependencies:

   ```
   pip install -r requirements.txt
   ```

2. Run the application:

   ```
   uvicorn src.app:app --reload
   ```

3. Run the backend tests:

   ```
   pytest
   ```

4. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                             | Description                                                     |
| ------ | ---------------------------------------------------- | --------------------------------------------------------------- |
| GET    | `/activities`                                        | Get all activities with their details and current participants |
| POST   | `/activities/{activity_name}/signup?email=...`       | Sign up for an activity                                         |
| DELETE | `/activities/{activity_name}/participants?email=...` | Unregister a participant from an activity                       |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
