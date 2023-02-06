// Generated by view binder compiler. Do not edit!
package com.mth.fastfood.databinding;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.viewbinding.ViewBinding;
import androidx.viewbinding.ViewBindings;
import com.google.android.material.button.MaterialButton;
import com.mth.fastfood.R;
import java.lang.NullPointerException;
import java.lang.Override;
import java.lang.String;

public final class ContentSingleBinding implements ViewBinding {
  @NonNull
  private final LinearLayout rootView;

  @NonNull
  public final ImageButton btnAddFavorito;

  @NonNull
  public final MaterialButton btnAddShopCart;

  @NonNull
  public final TextView clockHour;

  @NonNull
  public final ImageView iconClock;

  @NonNull
  public final ImageView iconMarkPoint;

  @NonNull
  public final TextView markPointAddress;

  private ContentSingleBinding(@NonNull LinearLayout rootView, @NonNull ImageButton btnAddFavorito,
      @NonNull MaterialButton btnAddShopCart, @NonNull TextView clockHour,
      @NonNull ImageView iconClock, @NonNull ImageView iconMarkPoint,
      @NonNull TextView markPointAddress) {
    this.rootView = rootView;
    this.btnAddFavorito = btnAddFavorito;
    this.btnAddShopCart = btnAddShopCart;
    this.clockHour = clockHour;
    this.iconClock = iconClock;
    this.iconMarkPoint = iconMarkPoint;
    this.markPointAddress = markPointAddress;
  }

  @Override
  @NonNull
  public LinearLayout getRoot() {
    return rootView;
  }

  @NonNull
  public static ContentSingleBinding inflate(@NonNull LayoutInflater inflater) {
    return inflate(inflater, null, false);
  }

  @NonNull
  public static ContentSingleBinding inflate(@NonNull LayoutInflater inflater,
      @Nullable ViewGroup parent, boolean attachToParent) {
    View root = inflater.inflate(R.layout.content_single, parent, false);
    if (attachToParent) {
      parent.addView(root);
    }
    return bind(root);
  }

  @NonNull
  public static ContentSingleBinding bind(@NonNull View rootView) {
    // The body of this method is generated in a way you would not otherwise write.
    // This is done to optimize the compiled bytecode for size and performance.
    int id;
    missingId: {
      id = R.id.btn_add_favorito;
      ImageButton btnAddFavorito = ViewBindings.findChildViewById(rootView, id);
      if (btnAddFavorito == null) {
        break missingId;
      }

      id = R.id.btn_add_shop_cart;
      MaterialButton btnAddShopCart = ViewBindings.findChildViewById(rootView, id);
      if (btnAddShopCart == null) {
        break missingId;
      }

      id = R.id.clock_hour;
      TextView clockHour = ViewBindings.findChildViewById(rootView, id);
      if (clockHour == null) {
        break missingId;
      }

      id = R.id.icon_clock;
      ImageView iconClock = ViewBindings.findChildViewById(rootView, id);
      if (iconClock == null) {
        break missingId;
      }

      id = R.id.icon_mark_point;
      ImageView iconMarkPoint = ViewBindings.findChildViewById(rootView, id);
      if (iconMarkPoint == null) {
        break missingId;
      }

      id = R.id.mark_point_address;
      TextView markPointAddress = ViewBindings.findChildViewById(rootView, id);
      if (markPointAddress == null) {
        break missingId;
      }

      return new ContentSingleBinding((LinearLayout) rootView, btnAddFavorito, btnAddShopCart,
          clockHour, iconClock, iconMarkPoint, markPointAddress);
    }
    String missingId = rootView.getResources().getResourceName(id);
    throw new NullPointerException("Missing required view with ID: ".concat(missingId));
  }
}
