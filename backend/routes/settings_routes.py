from flask import Blueprint, request
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from services.settings_service import (
    get_user_profile,
    update_user_profile,
    save_profile_image,
    change_user_password,
    update_chart_color,
    update_currency,
    update_number_display,
    update_theme,
    delete_user_account
)


settings_bp = Blueprint(
    "settings",
    __name__
)


# Get the current user's profile
@settings_bp.route(
    "/settings/profile",
    methods=["GET"]
)
@jwt_required()
def get_profile():

    user_id = int(
        get_jwt_identity()
    )

    profile = get_user_profile(
        user_id
    )

    if profile is None:

        return {
            "error": "User not found."
        }, 404

    return {
        "profile": profile
    }, 200


# Update username and display name
@settings_bp.route(
    "/settings/profile",
    methods=["PATCH"]
)
@jwt_required()
def update_profile():

    user_id = int(
        get_jwt_identity()
    )

    request_data = request.get_json()

    if not request_data:

        return {
            "error": (
                "No request data was provided."
            )
        }, 400

    username = request_data.get(
        "username"
    )

    display_name = request_data.get(
        "display_name"
    )

    if username is None:

        return {
            "error": "username is required."
        }, 400

    if display_name is None:

        return {
            "error": "display_name is required."
        }, 400

    username = username.strip()
    display_name = display_name.strip()

    if not username:

        return {
            "error": (
                "Username cannot be empty."
            )
        }, 400

    if not display_name:

        return {
            "error": (
                "Display name cannot be empty."
            )
        }, 400

    user, error = update_user_profile(
        user_id,
        username,
        display_name
    )

    if error:

        if error == (
            "Username is already in use."
        ):

            return {
                "error": error
            }, 409

        return {
            "error": error
        }, 404

    return {
        "message": (
            "Profile updated successfully."
        ),
        "profile": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "display_name": user.display_name,
            "profile_image": user.profile_image
        }
    }, 200


# Upload or replace profile image
@settings_bp.route(
    "/settings/profile/photo", #URL 
    methods=["POST"]
)
@jwt_required()
def update_profile_photo():

    user_id = int(
        get_jwt_identity()
    )

    image_file = request.files.get(
        "profile_image"
    )

    filename, error = save_profile_image(
        user_id,
        image_file
    )

    if error:

        return {
            "error": error
        }, 400

    return {
        "message": (
            "Profile image updated successfully."
        ),
        "profile_image": filename
    }, 200

# Change the current user's password
@settings_bp.route(
    "/settings/password",
    methods=["PATCH"]
)
@jwt_required()
def change_password():

    user_id = int(
        get_jwt_identity()
    )

    request_data = request.get_json()

    if not request_data:

        return {
            "error": (
                "No request data was provided."
            )
        }, 400

    current_password = request_data.get(
        "current_password"
    )

    new_password = request_data.get(
        "new_password"
    )

    confirm_password = request_data.get(
        "confirm_password"
    )

    if current_password is None:

        return {
            "error": (
                "Current password is required."
            )
        }, 400

    if new_password is None:

        return {
            "error": (
                "New password is required."
            )
        }, 400

    if confirm_password is None:

        return {
            "error": (
                "Password confirmation is required."
            )
        }, 400

    if new_password != confirm_password:

        return {
            "error": (
                "New password and confirmation "
                "do not match."
            )
        }, 400

    success, error = change_user_password(
        user_id,
        current_password,
        new_password
    )

    if error:

        if error == (
            "Current password is incorrect."
        ):

            return {
                "error": error
            }, 401

        return {
            "error": error
        }, 404

    return {
        "message": (
            "Password changed successfully."
        )
    }, 200


# Update the current user's chart color preference
@settings_bp.route(
    "/settings/preferences/chart-color",
    methods=["PATCH"]
)
@jwt_required()
def change_chart_color():

    user_id = int(
        get_jwt_identity()
    )

    request_data = request.get_json()

    if not request_data:

        return {
            "error": (
                "No request data was provided."
            )
        }, 400

    chart_color = request_data.get(
        "chart_color"
    )

    if chart_color is None:

        return {
            "error": (
                "chart_color is required."
            )
        }, 400

    user, error = update_chart_color(
        user_id,
        chart_color
    )

    if error:

        if error == "Invalid chart color.":

            return {
                "error": error
            }, 400

        return {
            "error": error
        }, 404

    return {
        "message": (
            "Chart color updated successfully."
        ),
        "chart_color": user.chart_color
    }, 200


# Update the current user's currency preference
@settings_bp.route(
    "/settings/preferences/currency",
    methods=["PATCH"]
)
@jwt_required()
def change_currency():
    user_id = int(
        get_jwt_identity()
    )

    request_data = request.get_json()

    if not request_data:
        return {
            "error": "No request data was provided."
        }, 400

    currency = request_data.get("currency")

    if currency is None:
        return {
            "error": "currency is required."
        }, 400

    user, error = update_currency(
        user_id,
        currency
    )

    if error:
        if error == "Invalid currency.":
            return {
                "error": error
            }, 400

        return {
            "error": error
        }, 404

    return {
        "message": "Currency updated successfully.",
        "currency": user.currency
    }, 200


# Update the current user's number display preference
@settings_bp.route(
    "/settings/preferences/number-display",
    methods=["PATCH"]
)
@jwt_required()
def change_number_display():
    user_id = int(
        get_jwt_identity()
    )

    request_data = request.get_json()

    if not request_data:
        return {
            "error": "No request data was provided."
        }, 400

    number_display = request_data.get(
        "number_display"
    )

    if number_display is None:
        return {
            "error": "number_display is required."
        }, 400

    user, error = update_number_display(
        user_id,
        number_display
    )

    if error:
        if error == "Invalid number display.":
            return {
                "error": error
            }, 400

        return {
            "error": error
        }, 404

    return {
        "message": "Number display updated successfully.",
        "number_display": user.number_display
    }, 200

# Update the current user's theme preference
@settings_bp.route(
    "/settings/preferences/theme",
    methods=["PATCH"]
)
@jwt_required()
def change_theme():
    user_id = int(
        get_jwt_identity()
    )

    request_data = request.get_json()

    if not request_data:
        return {
            "error": "No request data was provided."
        }, 400

    theme = request_data.get(
        "theme"
    )

    if theme is None:
        return {
            "error": "theme is required."
        }, 400

    user, error = update_theme(
        user_id,
        theme
    )

    if error:
        if error == "Invalid theme.":
            return {
                "error": error
            }, 400

        return {
            "error": error
        }, 404

    return {
        "message": "Theme updated successfully.",
        "theme": user.theme
    }, 200


# Log out the current user
@settings_bp.route(
    "/settings/logout",
    methods=["POST"]
)
@jwt_required()
def logout_user():
    return {
        "message": "Logout successful."
    }, 200

@settings_bp.route(
    "/settings/account",
    methods=["DELETE"]
)
@jwt_required()
def delete_account():
    user_id = int(
        get_jwt_identity()
    )

    request_data = request.get_json()

    if not request_data:
        return {
            "error": "No request data was provided."
        }, 400

    current_password = request_data.get(
        "current_password"
    )

    if current_password is None:
        return {
            "error": "Current password is required."
        }, 400

    success, error = delete_user_account(
        user_id,
        current_password
    )

    if error:
        if error == "Current password is incorrect.":
            return {
                "error": error
            }, 401

        return {
            "error": error
        }, 404

    return {
        "message": "Account deleted successfully."
    }, 200