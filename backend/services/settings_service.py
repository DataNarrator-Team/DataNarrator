import os
import uuid

from flask import current_app
from werkzeug.utils import secure_filename

from models.user import User
from database.database import db

from werkzeug.security import generate_password_hash
from services.auth_service import verify_user_password

# Get the current user's profile
def get_user_profile(user_id):

    user = User.query.get(user_id)

    if user is None:
        return None

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "display_name": (
            user.display_name
            if user.display_name
            else user.username
        ),
        "profile_image": user.profile_image
    }


# Check whether a username is already used
def is_username_taken(
    username,
    current_user_id
):

    existing_user = User.query.filter(
        User.username == username,
        User.id != current_user_id
    ).first()

    return existing_user is not None


# Update username and display name
def update_user_profile(
    user_id,
    username,
    display_name
):

    user = User.query.get(user_id)

    if user is None:
        return None, "User not found."

    # Check username uniqueness
    if username != user.username:

        if is_username_taken(
            username,
            user_id
        ):
            return None, (
                "Username is already in use."
            )

    user.username = username
    user.display_name = display_name

    db.session.commit()

    return user, None

# Change the current user's password
def change_user_password(
    user_id,
    current_password,
    new_password
):

    user = User.query.get(user_id)

    if user is None:
        return False, "User not found."

    # Verify the current password
    if not verify_user_password(
        current_password,
        user.password
    ):
        return False, (
            "Current password is incorrect."
        )

    # Prevent using the same password
    if verify_user_password(
        new_password,
        user.password
    ):
        return False, (
            "New password must be different "
            "from the current password."
        )

    # Hash the new password
    user.password = generate_password_hash(
        new_password
    )

    db.session.commit()

    return True, None

# Save or replace the user's profile image
def save_profile_image(
    user_id,
    image_file
):

    user = User.query.get(user_id)

    if user is None:
        return None, "User not found."

    if image_file is None:
        return None, "No image was provided."

    original_filename = (
        image_file.filename
    )

    if not original_filename:
        return None, (
            "Invalid image filename."
        )

    allowed_extensions = {
        "jpg",
        "jpeg",
        "png",
        "gif"
    }

    filename = secure_filename(
        original_filename
    )

    if "." not in filename:
        return None, (
            "Image file must have an extension."
        )

    extension = (
        filename
        .rsplit(".", 1)[-1]
        .lower()
    )

    if extension not in allowed_extensions:
        return None, (
            "Unsupported image format."
        )

    # Create profile image folder
    upload_folder = os.path.join(
        current_app.root_path,
        "uploads",
        "profile_images"
    )

    os.makedirs(
        upload_folder,
        exist_ok=True
    )

    # Generate a unique filename
    new_filename = (
        f"{uuid.uuid4().hex}.{extension}"
    )

    file_path = os.path.join(
        upload_folder,
        new_filename
    )

    # Save the new image
    image_file.save(file_path)

    # Delete the old image
    if user.profile_image:

        old_file_path = os.path.join(
            upload_folder,
            user.profile_image
        )

        if os.path.exists(
            old_file_path
        ):

            os.remove(
                old_file_path
            )

    # Save the new filename in database
    user.profile_image = new_filename

    db.session.commit()

    return new_filename, None


# Update the user's chart color preference
def update_chart_color(user_id, chart_color):

    user = User.query.get(user_id)

    if user is None:
        return None, "User not found."

    allowed_chart_colors = {
        "warm",
        "emerald",
        "purple",
        "cool"
    }

    if chart_color not in allowed_chart_colors:
        return None, "Invalid chart color."

    user.chart_color = chart_color

    db.session.commit()

    return user, None

# Update the user's currency preference
def update_currency(user_id, currency):
    user = User.query.get(user_id)

    if user is None:
        return None, "User not found."

    allowed_currencies = {
        "SAR",
        "USD",
        "EUR",
        "GBP",
        "AED",
        "KWD"
    }

    if currency not in allowed_currencies:
        return None, "Invalid currency."

    user.currency = currency
    db.session.commit()

    return user, None


# Update the user's number display preference
def update_number_display(user_id, number_display):
    user = User.query.get(user_id)

    if user is None:
        return None, "User not found."

    allowed_number_displays = {
        "full",
        "compact"
    }

    if number_display not in allowed_number_displays:
        return None, "Invalid number display."

    user.number_display = number_display
    db.session.commit()

    return user, None

# Update the user's theme preference
def update_theme(user_id, theme):
    user = User.query.get(user_id)

    if user is None:
        return None, "User not found."

    allowed_themes = {
        "light",
        "dark"
    }

    if theme not in allowed_themes:
        return None, "Invalid theme."

    user.theme = theme
    db.session.commit()

    return user, None

# Delete the current user's account
def delete_user_account(user_id, current_password):
    user = User.query.get(user_id)

    if user is None:
        return False, "User not found."

    if not verify_user_password(
        current_password,
        user.password
    ):
        return False, "Current password is incorrect."

    db.session.delete(user)
    db.session.commit()

    return True, None