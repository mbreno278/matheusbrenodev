// Generated by view binder compiler. Do not edit!
package com.mth.fastfood.databinding;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.Toolbar;
import androidx.coordinatorlayout.widget.CoordinatorLayout;
import androidx.viewbinding.ViewBinding;
import androidx.viewbinding.ViewBindings;
import com.google.android.material.appbar.AppBarLayout;
import com.google.android.material.appbar.CollapsingToolbarLayout;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.mth.fastfood.R;
import java.lang.NullPointerException;
import java.lang.Override;
import java.lang.String;

public final class ActivitySingleBinding implements ViewBinding {
  @NonNull
  private final CoordinatorLayout rootView;

  @NonNull
  public final AppBarLayout appBarLayout;

  @NonNull
  public final CollapsingToolbarLayout collapse;

  @NonNull
  public final ImageView collapseImage;

  @NonNull
  public final CoordinatorLayout coordinator;

  @NonNull
  public final FloatingActionButton fab;

  @NonNull
  public final View layoutHeaderShapes;

  @NonNull
  public final Toolbar toolbar;

  private ActivitySingleBinding(@NonNull CoordinatorLayout rootView,
      @NonNull AppBarLayout appBarLayout, @NonNull CollapsingToolbarLayout collapse,
      @NonNull ImageView collapseImage, @NonNull CoordinatorLayout coordinator,
      @NonNull FloatingActionButton fab, @NonNull View layoutHeaderShapes,
      @NonNull Toolbar toolbar) {
    this.rootView = rootView;
    this.appBarLayout = appBarLayout;
    this.collapse = collapse;
    this.collapseImage = collapseImage;
    this.coordinator = coordinator;
    this.fab = fab;
    this.layoutHeaderShapes = layoutHeaderShapes;
    this.toolbar = toolbar;
  }

  @Override
  @NonNull
  public CoordinatorLayout getRoot() {
    return rootView;
  }

  @NonNull
  public static ActivitySingleBinding inflate(@NonNull LayoutInflater inflater) {
    return inflate(inflater, null, false);
  }

  @NonNull
  public static ActivitySingleBinding inflate(@NonNull LayoutInflater inflater,
      @Nullable ViewGroup parent, boolean attachToParent) {
    View root = inflater.inflate(R.layout.activity_single, parent, false);
    if (attachToParent) {
      parent.addView(root);
    }
    return bind(root);
  }

  @NonNull
  public static ActivitySingleBinding bind(@NonNull View rootView) {
    // The body of this method is generated in a way you would not otherwise write.
    // This is done to optimize the compiled bytecode for size and performance.
    int id;
    missingId: {
      id = R.id.app_bar_layout;
      AppBarLayout appBarLayout = ViewBindings.findChildViewById(rootView, id);
      if (appBarLayout == null) {
        break missingId;
      }

      id = R.id.collapse;
      CollapsingToolbarLayout collapse = ViewBindings.findChildViewById(rootView, id);
      if (collapse == null) {
        break missingId;
      }

      id = R.id.collapse_image;
      ImageView collapseImage = ViewBindings.findChildViewById(rootView, id);
      if (collapseImage == null) {
        break missingId;
      }

      CoordinatorLayout coordinator = (CoordinatorLayout) rootView;

      id = R.id.fab;
      FloatingActionButton fab = ViewBindings.findChildViewById(rootView, id);
      if (fab == null) {
        break missingId;
      }

      id = R.id.layout_header_shapes;
      View layoutHeaderShapes = ViewBindings.findChildViewById(rootView, id);
      if (layoutHeaderShapes == null) {
        break missingId;
      }

      id = R.id.toolbar;
      Toolbar toolbar = ViewBindings.findChildViewById(rootView, id);
      if (toolbar == null) {
        break missingId;
      }

      return new ActivitySingleBinding((CoordinatorLayout) rootView, appBarLayout, collapse,
          collapseImage, coordinator, fab, layoutHeaderShapes, toolbar);
    }
    String missingId = rootView.getResources().getResourceName(id);
    throw new NullPointerException("Missing required view with ID: ".concat(missingId));
  }
}
